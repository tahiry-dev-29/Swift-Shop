#!/usr/bin/env node

/**
 * Script de test automatisé pour l'API GraphQL Dima
 * Teste toutes les opérations principales
 */

const API_URL = 'http://localhost:3000/graphql';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let adminToken = null;
let customerToken = null;
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

// Test data IDs
const testData = {
  productId: null,
  imageId: null,
  combinationId: null,
  stockId: null,
  categoryId: null,
  attributeGroupId: null,
  attributeValueId: null,
  addressId: null,
};

async function gql(query, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return { errors: [{ message: `HTTP ${response.status}` }] };
    }

    return await response.json();
  } catch (error) {
    return { errors: [{ message: error.message }] };
  }
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    log(`✅ ${name}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${name}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
}

async function test(name, queryFn, token = null, validator = null) {
  try {
    const query = typeof queryFn === 'function' ? queryFn() : queryFn;
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
  } catch (error) {
    logTest(name, false, error.message);
    return null;
  }
}

async function runTests() {
  log("\n🚀 Démarrage des tests de l'API GraphQL Dima\n", 'cyan');

  // ========================================
  // 1. AUTHENTICATION
  // ========================================
  log('📋 Section 1: Authentication', 'blue');

  const adminLogin = await test(
    'Admin Login',
    `mutation { employeeLogin(email: "superadmin@dima.com", password: "admin123") { accessToken employee { id firstname } } }`,
    null,
    (data) => !!data.employeeLogin?.accessToken,
  );

  if (adminLogin) {
    adminToken = adminLogin.employeeLogin.accessToken;
  }

  const customerLogin = await test(
    'Customer Login',
    `mutation { customerLogin(email: "customer@example.com", password: "customer123") { accessToken customer { id firstname } } }`,
    null,
    (data) => !!data.customerLogin?.accessToken,
  );

  if (customerLogin) {
    customerToken = customerLogin.customerLogin.accessToken;
  }

  // ========================================
  // 2. CATEGORIES
  // ========================================
  log('\n📋 Section 2: Categories', 'blue');

  await test(
    'List Category Tree',
    `query { categoryTree { id name active } }`,
    adminToken,
  );

  const createCat = await test(
    'Create Category',
    `mutation { createCategory(input: { name: "Test Category ${Date.now()}", active: true, position: 0 }) { id name } }`,
    adminToken,
    (data) => !!data.createCategory?.id,
  );

  if (createCat) {
    testData.categoryId = createCat.createCategory.id;

    await test(
      'Update Category',
      `mutation { updateCategory(id: ${testData.categoryId}, input: { name: "Updated Category" }) { id name } }`,
      adminToken,
    );
  }

  // ========================================
  // 3. ATTRIBUTES
  // ========================================
  log('\n📋 Section 3: Attributes', 'blue');

  await test(
    'List Attribute Groups',
    `query { attributeGroups { id name publicName values { id name } } }`,
    adminToken,
  );

  const createAttrGroup = await test(
    'Create Attribute Group',
    `mutation { createAttributeGroup(input: { name: "test_size_${Date.now()}", publicName: "Taille Test", type: "select", position: 0 }) { id name } }`,
    adminToken,
    (data) => !!data.createAttributeGroup?.id,
  );

  if (createAttrGroup) {
    testData.attributeGroupId = createAttrGroup.createAttributeGroup.id;

    const createAttrValue = await test(
      'Create Attribute Value',
      `mutation { createAttributeValue(groupId: ${testData.attributeGroupId}, input: { name: "M", position: 0 }) { id name } }`,
      adminToken,
      (data) => !!data.createAttributeValue?.id,
    );

    if (createAttrValue) {
      testData.attributeValueId = createAttrValue.createAttributeValue.id;

      await test(
        'Update Attribute Value',
        `mutation { updateAttributeValue(id: ${testData.attributeValueId}, input: { name: "L" }) { id name } }`,
        adminToken,
      );
    }
  }

  // ========================================
  // 4. PRODUCTS
  // ========================================
  log('\n📋 Section 4: Products', 'blue');

  await test(
    'List Products',
    `query { products(filter: { take: 5 }) { items { id name } total } }`,
    adminToken,
  );

  const createProduct = await test(
    'Create Product',
    `mutation { createProduct(input: { reference: "TEST-${Date.now()}", name: "Test Product", price: 29.99, active: true ${
      testData.categoryId ? `, categoryId: ${testData.categoryId}` : ''
    } }) { id reference name } }`,
    adminToken,
    (data) => !!data.createProduct?.id,
  );

  if (createProduct) {
    testData.productId = createProduct.createProduct.id;

    await test(
      'Get Product by ID',
      `query { product(id: ${testData.productId}) { id name price } }`,
      adminToken,
    );

    await test(
      'Update Product',
      `mutation { updateProduct(id: ${testData.productId}, input: { name: "Updated Product" }) { id name } }`,
      adminToken,
    );

    // ========================================
    // 5. PRODUCT IMAGES
    // ========================================
    log('\n📋 Section 5: Product Images', 'blue');

    const addImage = await test(
      'Add Product Image',
      `mutation { addProductImage(productId: ${testData.productId}, input: { filename: "test.jpg", originalName: "test.jpg", path: "uploads/test.jpg", mimeType: "image/jpeg", size: 1000, cover: true }) { id path cover } }`,
      adminToken,
      (data) => !!data.addProductImage?.id,
    );

    if (addImage) {
      testData.imageId = addImage.addProductImage.id;

      await test(
        'Set Cover Image',
        `mutation { setProductCoverImage(imageId: ${testData.imageId}) { id cover } }`,
        adminToken,
      );
    }

    // ========================================
    // 6. PRODUCT COMBINATIONS
    // ========================================
    log('\n📋 Section 6: Product Combinations', 'blue');

    if (testData.attributeValueId) {
      const addCombo = await test(
        'Add Product Combination',
        `mutation { addProductCombination(productId: ${testData.productId}, input: { priceImpact: 5.00, attributeValueIds: [${testData.attributeValueId}] }) { id priceImpact } }`,
        adminToken,
        (data) => !!data.addProductCombination?.id,
      );

      if (addCombo) {
        testData.combinationId = addCombo.addProductCombination.id;

        await test(
          'Update Product Combination',
          `mutation { updateProductCombination(id: ${testData.combinationId}, input: { priceImpact: 10.00 }) { id priceImpact } }`,
          adminToken,
        );
      }
    }

    // ========================================
    // 7. STOCK MANAGEMENT
    // ========================================
    log('\n📋 Section 7: Stock Management', 'blue');

    const updateStock = await test(
      'Update Stock',
      `mutation { updateStock(input: { productId: ${testData.productId}, quantity: 100 }) { id quantity } }`,
      adminToken,
      (data) => !!data.updateStock?.id,
    );

    if (updateStock) {
      testData.stockId = updateStock.updateStock.id;

      await test(
        'Increment Stock',
        `mutation { incrementStock(stockId: ${testData.stockId}, quantity: 50) { id quantity } }`,
        adminToken,
      );

      await test(
        'Decrement Stock',
        `mutation { decrementStock(stockId: ${testData.stockId}, quantity: 25) { id quantity } }`,
        adminToken,
      );

      await test(
        'Check Product Availability',
        `query { checkProductAvailability(productId: ${testData.productId}, quantity: 10) }`,
        adminToken,
      );
    }
  }

  // ========================================
  // 8. CUSTOMER OPERATIONS
  // ========================================
  log('\n📋 Section 8: Customer Operations', 'blue');

  await test(
    'Customer Me',
    `query { customerMe { id firstname email } }`,
    customerToken,
  );

  await test(
    'List My Addresses',
    `query { myAddresses { id alias city } }`,
    customerToken,
  );

  const createAddress = await test(
    'Create Address',
    `mutation { createAddress(input: { alias: "Test ${Date.now()}", firstname: "John", lastname: "Doe", address1: "123 Test St", postcode: "75000", city: "Paris", countryId: 1 }) { id alias } }`,
    customerToken,
    (data) => !!data.createAddress?.id,
  );

  if (createAddress) {
    testData.addressId = createAddress.createAddress.id;

    await test(
      'Update Address',
      `mutation { updateAddress(id: ${testData.addressId}, input: { alias: "Updated Address" }) { id alias } }`,
      customerToken,
    );
  }

  // ========================================
  // 9. ADMIN QUERIES
  // ========================================
  log('\n📋 Section 9: Admin Queries', 'blue');

  await test(
    'List Customers',
    `query { customers { id firstname email } }`,
    adminToken,
  );
  await test(
    'List Customer Groups',
    `query { customerGroups { id name } }`,
    adminToken,
  );
  await test(
    'List Employees',
    `query { employees { id firstname email } }`,
    adminToken,
  );
  await test(
    'Employee Me',
    `query { employeeMe { id firstname role { name } } }`,
    adminToken,
  );

  // ========================================
  // CLEANUP (Optional - delete test data)
  // ========================================
  log('\n📋 Cleanup: Deleting Test Data', 'blue');

  if (testData.addressId) {
    await test(
      'Delete Address',
      `mutation { deleteAddress(id: ${testData.addressId}) { id } }`,
      customerToken,
    );
  }

  if (testData.combinationId) {
    await test(
      'Delete Product Combination',
      `mutation { deleteProductCombination(id: ${testData.combinationId}) { id } }`,
      adminToken,
    );
  }

  if (testData.imageId) {
    await test(
      'Remove Product Image',
      `mutation { removeProductImage(id: ${testData.imageId}) { id } }`,
      adminToken,
    );
  }

  if (testData.productId) {
    await test(
      'Delete Product',
      `mutation { deleteProduct(id: ${testData.productId}) { id } }`,
      adminToken,
    );
  }

  if (testData.attributeValueId) {
    await test(
      'Delete Attribute Value',
      `mutation { deleteAttributeValue(id: ${testData.attributeValueId}) { id } }`,
      adminToken,
    );
  }

  if (testData.attributeGroupId) {
    await test(
      'Delete Attribute Group',
      `mutation { deleteAttributeGroup(id: ${testData.attributeGroupId}) { id } }`,
      adminToken,
    );
  }

  if (testData.categoryId) {
    await test(
      'Delete Category',
      `mutation { deleteCategory(id: ${testData.categoryId}) { id } }`,
      adminToken,
    );
  }

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 RÉSULTATS DES TESTS', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Total: ${testResults.total}`, 'blue');
  log(`✅ Réussis: ${testResults.passed}`, 'green');
  log(`❌ Échoués: ${testResults.failed}`, 'red');
  log(
    `📈 Taux de réussite: ${(
      (testResults.passed / testResults.total) *
      100
    ).toFixed(1)}%`,
    'yellow',
  );
  log('='.repeat(50) + '\n', 'cyan');

  if (testResults.failed === 0) {
    log('🎉 Tous les tests sont passés avec succès !', 'green');
  } else {
    log(
      '⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.',
      'yellow',
    );
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});
