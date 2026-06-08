// Node 18+ has built-in fetch

const API_URL = 'http://localhost:3000/graphql';
const ADMIN_EMAIL = 'superadmin@dima.com';
const ADMIN_PASS = 'admin123';

async function gql(query, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  return response.json();
}

async function runTests() {
  console.log('🚀 Starting Pricing Engine Tests...\n');

  // 1. Login
  console.log('🔑 Authenticating Admin...');
  const loginRes = await gql(
    `mutation { employeeLogin(email: "${ADMIN_EMAIL}", password: "${ADMIN_PASS}") { accessToken } }`,
  );
  const token = loginRes.data?.employeeLogin?.accessToken;
  if (!token) throw new Error('Login failed');
  console.log('✅ Admin Logged In\n');

  // 2. Create Country (MG)
  console.log('🌍 Creating Country MG...');
  const countryRes = await gql(
    `mutation { createCountry(input: { isoCode: "MG", name: "Madagascar", taxRate: 20.0, active: true }) { id name isoCode taxRate } }`,
    token,
  );
  const country = countryRes.data?.createCountry;
  if (!country)
    throw new Error(
      'Create Country failed: ' + JSON.stringify(countryRes.errors),
    );
  console.log(
    `✅ Country Created: ${country.name} (${country.isoCode}) - ID: ${country.id}\n`,
  );

  // 3. Create Product for testing
  console.log('🛍️ Creating Test Product...');
  const prodRes = await gql(
    `mutation { createProduct(input: { reference: "TEST-PRICE-${Date.now()}", name: "Pricing Test Product", price: 100.0, active: true }) { id price } }`,
    token,
  );
  const product = prodRes.data?.createProduct;
  if (!product) throw new Error('Create Product failed');
  console.log(
    `✅ Product Created: ID ${product.id} - Price: ${product.price}\n`,
  );

  // 4. Calculate Price (Standard)
  console.log('🧮 Calculating Standard Price (MG)...');
  const calc1 = await gql(
    `query { calculatePrice(productId: ${product.id}, countryId: ${country.id}) { basePrice priceHT taxRate taxAmount priceTTC } }`,
    token,
  );
  const p1 = calc1.data?.calculatePrice;
  console.log(
    `   Base: ${p1.basePrice} | HT: ${p1.priceHT} | Tax: ${p1.taxRate}% | TTC: ${p1.priceTTC}`,
  );
  if (p1.priceTTC !== 120)
    console.error('⚠️ Price mismatch! Expected 120'); // 100 + 20%
  else console.log('✅ Standard Price Correct\n');

  // 5. Create Specific Price (-10%)
  console.log('🏷️ Creating -10% Specific Price...');
  const spRes = await gql(
    `mutation { createSpecificPrice(input: { productId: ${product.id}, reductionType: "percentage", reduction: 10, countryId: ${country.id} }) { id reduction } }`,
    token,
  );
  const sp = spRes.data?.createSpecificPrice;
  console.log(`✅ specific Price Rule Created: ID ${sp.id}\n`);

  // 6. Calculate Price (With Discount)
  console.log('🧮 Calculating Discounted Price...');
  const calc2 = await gql(
    `query { calculatePrice(productId: ${product.id}, countryId: ${country.id}) { basePrice specificPriceReduction priceHT priceTTC } }`,
    token,
  );
  const p2 = calc2.data?.calculatePrice;
  console.log(
    `   Base: ${p2.basePrice} | Reduction: ${p2.specificPriceReduction} | HT: ${p2.priceHT} | TTC: ${p2.priceTTC}`,
  );
  // Expected: 100 - 10 = 90 HT. 90 + 20% (18) = 108 TTC.
  if (p2.priceTTC !== 108)
    console.error('⚠️ Discount Price mismatch! Expected 108');
  else console.log('✅ Discounted Price Correct\n');

  // 7. Cleanup
  console.log('🧹 Cleaning up...');
  await gql(`mutation { deleteSpecificPrice(id: ${sp.id}) { id } }`, token);
  await gql(`mutation { deleteProduct(id: ${product.id}) { id } }`, token);
  await gql(`mutation { deleteCountry(id: ${country.id}) { id } }`, token);
  console.log('✅ Cleanup Complete');
}

runTests().catch((e) => console.error('❌ Test Failed:', e));
