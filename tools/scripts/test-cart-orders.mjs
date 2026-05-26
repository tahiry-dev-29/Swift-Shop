const API_URL = 'http://localhost:3000/graphql';

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

async function gql(query, token = null, headers = {}) {
  const allHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };
  if (token) {
    allHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: allHeaders,
      body: JSON.stringify({ query }),
    });
    
    const json = await response.json();
    if (json.errors) {
       // log(`GraphQL Error: ${JSON.stringify(json.errors)}`, COLORS.red);
       return { errors: json.errors };
    }
    return json.data;
  } catch (error) {
    log(`Network Error: ${error.message}`, COLORS.red);
    return null;
  }
}

async function test(name, query, token, validator, headers = {}) {
  process.stdout.write(`  ${name.padEnd(50)}`);
  const data = await gql(query, token, headers);
  
  if (!data || data.errors) {
    console.log(`${COLORS.red}❌${COLORS.reset}`);
    if (data && data.errors) console.error(data.errors);
    return false;
  }

  try {
    if (validator && !validator(data)) {
      console.log(`${COLORS.red}❌ (Validator Failed)${COLORS.reset}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      return false;
    }
    console.log(`${COLORS.green}✅${COLORS.reset}`);
    return true;
  } catch (e) {
    console.log(`${COLORS.red}❌ (Exception)${COLORS.reset}`);
    console.error(e);
    return false;
  }
}

async function runTests() {
  log(`\n🚀 CART & ORDERS TEST SUITE\n`, COLORS.bright + COLORS.blue);
  
  let passed = 0;
  let total = 0;
  let customerToken = '';
  let customerId = '';
  let productId = '';
  let combinationId = '';
  let addressId = '';
  let cartId = '';
  let sessionId = 'session-' + Date.now();

  // 0. Setup: Login & Get Data
  log(`0. SETUP`, COLORS.yellow);
  
  // Login
  const loginData = await gql(`mutation { customerLogin(email: "marie.dupont@gmail.com", password: "customer123") { accessToken customer { id } } }`);
  if (loginData && loginData.customerLogin) {
      customerToken = loginData.customerLogin.accessToken;
      customerId = loginData.customerLogin.customer.id;
      log(`  Customer Logged In`, COLORS.green);
  } else {
      log(`  Customer Login Failed`, COLORS.red);
      console.log('Response:', JSON.stringify(loginData, null, 2));
      process.exit(1);
  }

  // Get a product
  const productsRes = await gql(`query { products { items { id name combinations { id } } } }`);
  if (productsRes && productsRes.products && productsRes.products.items.length > 0) {
      const p = productsRes.products.items[0];
      productId = p.id;
      if (p.combinations.length > 0) combinationId = p.combinations[0].id;
      log(`  Product Found: ${productId}`, COLORS.green);
  } else {
      log(`  No products found`, COLORS.red);
      process.exit(1);
  }
  
  // Get an address
  const addressData = await gql(`query { myAddresses { id } }`, customerToken);
  if (addressData && addressData.myAddresses.length > 0) {
      addressId = addressData.myAddresses[0].id;
      log(`  Address Found: ${addressId}`, COLORS.green);
  } else {
       // Create address if none
       log(`  Creating Address...`, COLORS.yellow);
       const countryData = await gql(`query { countries { id } }`);
       const countryId = countryData.countries[0].id;
       const newAddr = await gql(`mutation { createAddress(input: { alias: "Test", firstname: "Test", lastname: "Test", address1: "123 Rue", postcode: "75000", city: "Paris", countryId: "${countryId}" }) { id } }`, customerToken);
       addressId = newAddr.createAddress.id;
       log(`  Address Created: ${addressId}`, COLORS.green);
  }

  // 1. CART OPERATIONS
  log(`\n🛒 1. CART OPERATIONS`, COLORS.yellow);

  // Clear existing cart first
  await gql(`mutation { clearCart { id } }`, customerToken);

  total++;
  if (await test(
      'Add to Cart',
      `mutation { addToCart(input: { productId: "${productId}", quantity: 2${combinationId ? `, combinationId: "${combinationId}"` : ''} }) { id items { quantity product { name } lineTotal } totalTTC } }`,
      customerToken,
      d => d.addToCart && d.addToCart.items.length === 1 && d.addToCart.items[0].quantity === 2
  )) passed++;

  // Save Cart ID
  const cartRes = await gql(`query { myCart { id } }`, customerToken);
  cartId = cartRes.myCart.id;

  total++;
  if (await test(
      'Update Quantity (Increment)',
      `mutation { addToCart(input: { productId: "${productId}", quantity: 1${combinationId ? `, combinationId: "${combinationId}"` : ''} }) { items { quantity } } }`,
      customerToken,
      d => d.addToCart.items[0].quantity === 3
  )) passed++;

  // Get cart item id
  const cartData = await gql(`query { myCart { items { id } } }`, customerToken);
  const cartItemId = cartData.myCart.items[0].id;

  total++;
  if (await test(
      'Update Cart Item Quantity',
      `mutation { updateCartItem(cartItemId: "${cartItemId}", quantity: 5) { items { quantity } } }`,
      customerToken,
      d => d.updateCartItem.items[0].quantity === 5
  )) passed++;
  
  total++;
  if (await test(
      'Get Cart With Totals',
      `query { myCart { totalHT totalTax totalTTC itemCount } }`,
      customerToken,
      d => d.myCart.itemCount === 5 && d.myCart.totalTTC > 0
  )) passed++;

  // 2. ORDER OPERATIONS
  log(`\n📦 2. ORDER OPERATIONS`, COLORS.yellow);

  total++;
  if (await test(
      'Create Order From Cart',
      `mutation { createOrder(input: { cartId: "${cartId}", deliveryAddressId: "${addressId}" }) { id reference totalTTC state { name } } }`,
      customerToken,
      d => d.createOrder && d.createOrder.reference.startsWith('DO-') && d.createOrder.state.name === 'PENDING'
  )) passed++;

  total++;
  if (await test(
      'Cart Should Be Empty',
      `query { myCart { items { id } } }`,
      customerToken,
      d => d.myCart && d.myCart.items.length === 0
  )) passed++;

  total++;
  if (await test(
      'List My Orders',
      `query { myOrders { id reference totalTTC items { productName } } }`,
      customerToken,
      d => d.myOrders.length > 0 && d.myOrders[0].items.length > 0
  )) passed++;

  const lastOrderId = (await gql(`query { myOrders { id } }`, customerToken)).myOrders[0].id;

  total++;
  if (await test(
      'Get Order Details',
      `query { order(id: "${lastOrderId}") { id addresses { city } } }`,
      customerToken,
      d => d.order && d.order.addresses.length > 0
  )) passed++;
  
  total++;
  if (await test(
      'Get Order States',
      `query { orderStates { name color } }`,
      null,
      d => d.orderStates.length >= 5
  )) passed++;

  // 3. GUEST SESSIONS & MERGE
  log(`\n👤 3. GUEST & MERGE`, COLORS.yellow);
  
  // Add item as guest
  total++;
  if (await test(
      'Add to Cart as Guest',
      `mutation { addToCart(input: { productId: "${productId}", quantity: 1${combinationId ? `, combinationId: "${combinationId}"` : ''} }) { id } }`,
      null,
      d => d.addToCart && d.addToCart.id,
      { 'x-session-id': sessionId }
  )) passed++;

  // Login with session merge
  // We simulate the client flow: header on login request
  total++;
  if (await test(
      'Login & Merge Cart',
      `mutation { customerLogin(email: "marie.dupont@gmail.com", password: "customer123") { customer { id } } }`,
      null,
      d => d.customerLogin,
      { 'x-session-id': sessionId }
  )) passed++;
  
  // Verify items merged (Cart was empty after order, now should have 1 item from guest)
  total++;
  if (await test(
      'Verify Merged Cart (1 item)',
      `query { myCart { items { quantity } } }`,
      customerToken,
      d => d.myCart.items.length === 1 && d.myCart.items[0].quantity === 1
  )) passed++;


  log(`\n════════════════════════════════════════════════════════════`, COLORS.blue);
  log(`📊 FINAL RESULTS`, COLORS.bright);
  log(`Total:   ${total}`);
  log(`Passed:  ${passed}`, passed === total ? COLORS.green : COLORS.red);
  log(`Failed:  ${total - passed}`, total - passed > 0 ? COLORS.red : COLORS.green);
  log(`Success: ${Math.round((passed / total) * 100)}%`);
  log(`════════════════════════════════════════════════════════════\n`, COLORS.blue);
  
  if (passed !== total) process.exit(1);
}

runTests();
