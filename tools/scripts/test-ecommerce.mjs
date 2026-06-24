#!/usr/bin/env node

/**
 * COMPREHENSIVE E-commerce Test Suite
 * Tests ALL GraphQL operations: Auth, Catalog, Pricing, Stock, Addresses
 */

const API_URL = 'http://localhost:3000/graphql';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const tokens = { admin: null, customer: null };
const testResults = { passed: 0, failed: 0, total: 0 };
const testData = {};

async function gql(query, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });
    return await response.json();
  } catch (error) {
    return { errors: [{ message: error.message }] };
  }
}

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`  ✅ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`  ❌ ${name}`, 'red');
    if (details) log(`     → ${details}`, 'yellow');
  }
}

async function test(name, query, token = null, validator = null) {
  const result = await gql(query, token);
  if (result.errors) {
    logTest(name, false, result.errors[0].message);
    return null;
  }
  if (validator) {
    const isValid = validator(result.data);
    logTest(name, isValid);
    return isValid ? result.data : null;
  }
  logTest(name, true);
  return result.data;
}

// ============================================================
// 1. AUTHENTICATION
// ============================================================
async function testAuthentication() {
  log('\n🔐 1. AUTHENTICATION', 'cyan');

  const admin = await test(
    'Admin login',
    `mutation { employeeLogin(email: "superadmin@dima.com", password: "admin123") { accessToken employee { id role { name } } } }`,
    null,
    (d) => !!d.employeeLogin?.accessToken,
  );
  if (admin) tokens.admin = admin.employeeLogin.accessToken;

  const customer = await test(
    'Customer login',
    `mutation { customerLogin(email: "marie.dupont@gmail.com", password: "customer123") { accessToken customer { id group { name } } } }`,
    null,
    (d) => !!d.customerLogin?.accessToken,
  );
  if (customer) tokens.customer = customer.customerLogin.accessToken;

  const wrongPass = await gql(
    `mutation { customerLogin(email: "marie.dupont@gmail.com", password: "wrong") { accessToken } }`,
  );
  logTest('Reject invalid password', !!wrongPass.errors);

  const noUser = await gql(
    `mutation { customerLogin(email: "fake@test.com", password: "test") { accessToken } }`,
  );
  logTest('Reject non-existent user', !!noUser.errors);

  return !!tokens.admin && !!tokens.customer;
}

// ============================================================
// 2. CATEGORIES CRUD
// ============================================================
async function testCategories() {
  log('\n📂 2. CATEGORIES CRUD', 'cyan');

  await test(
    'List categories',
    `query { categories { id name } }`,
    tokens.admin,
    (d) => d.categories?.length >= 5,
  );
  await test(
    'Get category tree',
    `query { categoryTree { id name active } }`,
    tokens.admin,
    (d) => d.categoryTree?.length >= 5,
  );

  // Create
  const cat = await test(
    'Create category',
    `mutation { createCategory(input: { name: "TestCat_${Date.now()}", active: true, position: 99 }) { id name } }`,
    tokens.admin,
    (d) => !!d.createCategory?.id,
  );
  if (cat?.createCategory?.id) {
    testData.categoryId = cat.createCategory.id;

    // Read
    await test(
      'Get category by ID',
      `query { category(id: "${testData.categoryId}") { id name } }`,
      tokens.admin,
      (d) => !!d.category?.id,
    );
    await test(
      'Get category path',
      `query { categoryPath(id: "${testData.categoryId}") }`,
      tokens.admin,
    );

    // Update
    await test(
      'Update category',
      `mutation { updateCategory(id: "${testData.categoryId}", input: { name: "Updated" }) { id name } }`,
      tokens.admin,
      (d) => d.updateCategory?.name === 'Updated',
    );
  }
}

// ============================================================
// 3. ATTRIBUTES CRUD
// ============================================================
async function testAttributes() {
  log('\n🎨 3. ATTRIBUTES CRUD', 'cyan');

  await test(
    'List attribute groups',
    `query { attributeGroups { id name values { id name } } }`,
    tokens.admin,
    (d) => d.attributeGroups?.length >= 2,
  );

  // Create Group
  const grp = await test(
    'Create attribute group',
    `mutation { createAttributeGroup(input: { name: "test_grp_${Date.now()}", publicName: "Test", type: "select", position: 99 }) { id name } }`,
    tokens.admin,
    (d) => !!d.createAttributeGroup?.id,
  );
  if (grp?.createAttributeGroup?.id) {
    testData.attrGroupId = grp.createAttributeGroup.id;

    // Get group
    await test(
      'Get attribute group',
      `query { attributeGroup(id: "${testData.attrGroupId}") { id name } }`,
      tokens.admin,
      (d) => !!d.attributeGroup?.id,
    );

    // Create Value
    const val = await test(
      'Create attribute value',
      `mutation { createAttributeValue(groupId: "${testData.attrGroupId}", input: { name: "Val1", position: 0 }) { id name } }`,
      tokens.admin,
      (d) => !!d.createAttributeValue?.id,
    );
    if (val?.createAttributeValue?.id) {
      testData.attrValueId = val.createAttributeValue.id;

      // Update Value
      await test(
        'Update attribute value',
        `mutation { updateAttributeValue(id: "${testData.attrValueId}", input: { name: "UpdatedVal" }) { id name } }`,
        tokens.admin,
        (d) => d.updateAttributeValue?.name === 'UpdatedVal',
      );
    }

    // Update Group
    await test(
      'Update attribute group',
      `mutation { updateAttributeGroup(id: "${testData.attrGroupId}", input: { publicName: "Updated" }) { id publicName } }`,
      tokens.admin,
      (d) => d.updateAttributeGroup?.publicName === 'Updated',
    );
  }
}

// ============================================================
// 4. PRODUCTS CRUD + IMAGES + COMBINATIONS + STOCK
// ============================================================
async function testProducts() {
  log('\n📦 4. PRODUCTS CRUD', 'cyan');

  await test(
    'List products',
    `query { products(filter: { take: 20 }) { items { id name } total } }`,
    tokens.admin,
    (d) => d.products?.total >= 20,
  );

  // Create product
  const prod = await test(
    'Create product',
    `mutation { createProduct(input: { reference: "TEST_${Date.now()}", name: "Test Product", price: 99.99, active: true }) { id name } }`,
    tokens.admin,
    (d) => !!d.createProduct?.id,
  );
  if (prod?.createProduct?.id) {
    testData.productId = prod.createProduct.id;

    // Read
    await test(
      'Get product by ID',
      `query { product(id: "${testData.productId}") { id name price } }`,
      tokens.admin,
      (d) => !!d.product?.id,
    );

    // Update
    await test(
      'Update product',
      `mutation { updateProduct(id: "${testData.productId}", input: { name: "Updated Product", price: 149.99 }) { id name price } }`,
      tokens.admin,
      (d) => d.updateProduct?.name === 'Updated Product',
    );

    // === IMAGES ===
    log('\n🖼️  4.1 PRODUCT IMAGES', 'cyan');
    const img = await test(
      'Add product image',
      `mutation { addProductImage(productId: "${testData.productId}", input: { filename: "test.jpg", originalName: "test.jpg", path: "uploads/test.jpg", mimeType: "image/jpeg", size: 1000, cover: false }) { id cover } }`,
      tokens.admin,
      (d) => !!d.addProductImage?.id,
    );
    if (img?.addProductImage?.id) {
      testData.imageId = img.addProductImage.id;
      await test(
        'Set cover image',
        `mutation { setProductCoverImage(imageId: "${testData.imageId}") { id cover } }`,
        tokens.admin,
        (d) => d.setProductCoverImage?.cover === true,
      );
    }

    // === STOCK ===
    log('\n📊 4.2 STOCK MANAGEMENT', 'cyan');
    const stk = await test(
      'Update stock (create)',
      `mutation { updateStock(input: { productId: "${testData.productId}", quantity: 100, minQuantity: 5 }) { id quantity } }`,
      tokens.admin,
      (d) => d.updateStock?.quantity === 100,
    );
    if (stk?.updateStock?.id) {
      testData.stockId = stk.updateStock.id;

      await test(
        'Increment stock +50',
        `mutation { incrementStock(stockId: "${testData.stockId}", quantity: 50) { id quantity } }`,
        tokens.admin,
        (d) => d.incrementStock?.quantity === 150,
      );
      await test(
        'Decrement stock -25',
        `mutation { decrementStock(stockId: "${testData.stockId}", quantity: 25) { id quantity } }`,
        tokens.admin,
        (d) => d.decrementStock?.quantity === 125,
      );
      await test(
        'Check availability',
        `query { checkProductAvailability(productId: "${testData.productId}", quantity: 10) }`,
        null,
        (d) => d.checkProductAvailability === true,
      );
    }

    // === COMBINATIONS ===
    if (testData.attrValueId) {
      log('\n🔀 4.3 PRODUCT COMBINATIONS', 'cyan');
      const combo = await test(
        'Add combination',
        `mutation { addProductCombination(productId: "${testData.productId}", input: { priceImpact: 10, attributeValueIds: ["${testData.attrValueId}"] }) { id priceImpact } }`,
        tokens.admin,
        (d) => !!d.addProductCombination?.id,
      );
      if (combo?.addProductCombination?.id) {
        testData.combinationId = combo.addProductCombination.id;
        await test(
          'Update combination',
          `mutation { updateProductCombination(id: "${testData.combinationId}", input: { priceImpact: 15 }) { id priceImpact } }`,
          tokens.admin,
          (d) => parseFloat(d.updateProductCombination?.priceImpact) === 15,
        );
      }
    }
  }
}

// ============================================================
// 5. PRICING ENGINE
// ============================================================
async function testPricing() {
  log('\n💰 5. PRICING ENGINE', 'cyan');

  await test(
    'List countries',
    `query { countries { id isoCode name taxRate } }`,
    tokens.admin,
    (d) => d.countries?.length >= 8,
  );

  // Get product and country for calculatePrice
  const prods = await gql(
    `query { products(filter: { take: 1 }) { items { id } } }`,
    tokens.admin,
  );
  const countries = await gql(
    `query { countries { id isoCode } }`,
    tokens.admin,
  );

  if (prods.data?.products?.items?.[0] && countries.data?.countries?.[0]) {
    const productId = prods.data.products.items[0].id;
    const countryId =
      countries.data.countries.find((c) => c.isoCode === 'FR')?.id ||
      countries.data.countries[0].id;

    await test(
      'Calculate price (with tax)',
      `query { calculatePrice(productId: "${productId}", countryId: "${countryId}") { basePrice taxRate taxAmount priceTTC } }`,
      null,
      (d) =>
        !!d.calculatePrice?.priceTTC &&
        parseFloat(d.calculatePrice.priceTTC) > 0,
    );
  }

  // Specific prices
  await test(
    'List specific prices',
    `query { specificPrices { id reduction reductionType productId } }`,
    tokens.admin,
    (d) => Array.isArray(d.specificPrices),
  );

  // Create specific price
  if (testData.productId) {
    const sp = await test(
      'Create specific price (10% off)',
      `mutation { createSpecificPrice(input: { productId: "${testData.productId}", reductionType: "percentage", reduction: 10, priority: 1 }) { id reduction } }`,
      tokens.admin,
      (d) => !!d.createSpecificPrice?.id,
    );
    if (sp?.createSpecificPrice?.id) {
      testData.specificPriceId = sp.createSpecificPrice.id;
      await test(
        'Update specific price',
        `mutation { updateSpecificPrice(id: "${testData.specificPriceId}", input: { reduction: 15 }) { id reduction } }`,
        tokens.admin,
        (d) => parseFloat(d.updateSpecificPrice?.reduction) === 15,
      );
    }
  }
}

// ============================================================
// 6. CUSTOMER GROUPS
// ============================================================
async function testCustomerGroups() {
  log('\n👥 6. CUSTOMER GROUPS', 'cyan');

  const groups = await test(
    'List customer groups',
    `query { customerGroups { id name reduction } }`,
    tokens.admin,
    (d) => d.customerGroups?.length >= 4,
  );

  if (groups) {
    logTest(
      'VIP group has 10% reduction',
      groups.customerGroups.some(
        (g) => g.name === 'VIP' && parseFloat(g.reduction) === 10,
      ),
    );
    logTest(
      'Wholesale has 15% reduction',
      groups.customerGroups.some(
        (g) => g.name === 'Wholesale' && parseFloat(g.reduction) === 15,
      ),
    );
  }

  await test(
    'List all customers',
    `query { customers { id email group { name } } }`,
    tokens.admin,
    (d) => d.customers?.length >= 15,
  );
}

// ============================================================
// 7. ADDRESSES CRUD
// ============================================================
async function testAddresses() {
  log('\n🏠 7. ADDRESSES CRUD', 'cyan');

  // Get a country ID first
  const countries = await gql(
    `query { countries { id isoCode } }`,
    tokens.admin,
  );
  const countryId = countries.data?.countries?.find(
    (c) => c.isoCode === 'FR',
  )?.id;

  if (countryId) {
    await test(
      'List my addresses',
      `query { myAddresses { id alias city } }`,
      tokens.customer,
    );

    const addr = await test(
      'Create address',
      `mutation { createAddress(input: { alias: "Test_${Date.now()}", firstname: "Test", lastname: "User", address1: "123 Test St", postcode: "75001", city: "Paris", countryId: "${countryId}" }) { id alias city } }`,
      tokens.customer,
      (d) => !!d.createAddress?.id,
    );
    if (addr?.createAddress?.id) {
      testData.addressId = addr.createAddress.id;

      await test(
        'Get address by ID',
        `query { address(id: "${testData.addressId}") { id alias } }`,
        tokens.customer,
        (d) => !!d.address?.id,
      );

      await test(
        'Update address',
        `mutation { updateAddress(id: "${testData.addressId}", input: { city: "Lyon" }) { id city } }`,
        tokens.customer,
        (d) => d.updateAddress?.city === 'Lyon',
      );
    }
  }

  // Admin list all
  await test(
    'Admin list all addresses',
    `query { addresses { id alias customerId } }`,
    tokens.admin,
  );
}

// ============================================================
// 8. SECURITY
// ============================================================
async function testSecurity() {
  log('\n🔒 8. SECURITY', 'cyan');

  const adminOnly = await gql(`query { employees { id } }`, tokens.customer);
  logTest('Customer cannot access employees', !!adminOnly.errors);

  const noAuth = await gql(
    `mutation { createProduct(input: { reference: "HACK", name: "Hacked", price: 0 }) { id } }`,
  );
  logTest('No auth cannot create product', !!noAuth.errors);

  if (testData.productId) {
    const custDel = await gql(
      `mutation { deleteProduct(id: "${testData.productId}") { id } }`,
      tokens.customer,
    );
    logTest('Customer cannot delete product', !!custDel.errors);
  }
}

// ============================================================
// 9. CLEANUP
// ============================================================
async function cleanup() {
  log('\n🧹 9. CLEANUP', 'cyan');

  if (testData.addressId)
    await test(
      'Delete address',
      `mutation { deleteAddress(id: "${testData.addressId}") { id } }`,
      tokens.customer,
    );
  if (testData.specificPriceId)
    await test(
      'Delete specific price',
      `mutation { deleteSpecificPrice(id: "${testData.specificPriceId}") { id } }`,
      tokens.admin,
    );
  if (testData.combinationId)
    await test(
      'Delete combination',
      `mutation { deleteProductCombination(id: "${testData.combinationId}") { id } }`,
      tokens.admin,
    );
  if (testData.imageId)
    await test(
      'Remove image',
      `mutation { removeProductImage(id: "${testData.imageId}") { id } }`,
      tokens.admin,
    );
  if (testData.productId)
    await test(
      'Delete product',
      `mutation { deleteProduct(id: "${testData.productId}") { id } }`,
      tokens.admin,
    );
  if (testData.attrValueId)
    await test(
      'Delete attribute value',
      `mutation { deleteAttributeValue(id: "${testData.attrValueId}") { id } }`,
      tokens.admin,
    );
  if (testData.attrGroupId)
    await test(
      'Delete attribute group',
      `mutation { deleteAttributeGroup(id: "${testData.attrGroupId}") { id } }`,
      tokens.admin,
    );
  if (testData.categoryId)
    await test(
      'Delete category',
      `mutation { deleteCategory(id: "${testData.categoryId}") { id } }`,
      tokens.admin,
    );
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  log('\n' + '═'.repeat(60), 'magenta');
  log('🚀 COMPREHENSIVE E-COMMERCE API TEST SUITE', 'magenta');
  log('═'.repeat(60), 'magenta');

  await testAuthentication();
  await testCategories();
  await testAttributes();
  await testProducts();
  await testPricing();
  await testCustomerGroups();
  await testAddresses();
  await testSecurity();
  await cleanup();

  log('\n' + '═'.repeat(60), 'magenta');
  log('📊 FINAL RESULTS', 'magenta');
  log('═'.repeat(60), 'magenta');
  log(`Total:   ${testResults.total}`, 'blue');
  log(`Passed:  ${testResults.passed}`, 'green');
  log(
    `Failed:  ${testResults.failed}`,
    testResults.failed > 0 ? 'red' : 'green',
  );
  const rate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(
    `Success: ${rate}%`,
    rate >= 95 ? 'green' : rate >= 80 ? 'yellow' : 'red',
  );
  log('═'.repeat(60) + '\n', 'magenta');

  if (testResults.failed === 0) {
    log('🎉 All tests passed! API is fully functional.\n', 'green');
  } else {
    log(`⚠️  ${testResults.failed} test(s) failed.\n`, 'yellow');
    process.exit(1);
  }
}

main().catch((e) => {
  log(`\n❌ Fatal error: ${e.message}`, 'red');
  process.exit(1);
});
