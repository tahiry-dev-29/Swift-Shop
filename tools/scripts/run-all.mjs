import { gql, log } from './test-utils.mjs';
import { testAddressModule } from './address.test.mjs';
import { testCatalogModule } from './catalog.test.mjs';
import { testCatalogAttributes } from './attributes.test.mjs';

(async () => {
  console.log('🚀 Testing All GraphQL APIs\n');
  
  // 1. Employee Authentication
  console.log('=== 1. Employee Authentication ===');
  const loginRes = await gql(`
    mutation {
      employeeLogin(email: "superadmin@dima.com", password: "admin123") {
        accessToken
        employee { id firstname lastname email role { id name } }
      }
    }
  `);
  
  if (loginRes.errors) {
    log('👔', 'Employee Login', false, loginRes.errors);
    process.exit(1);
  }
  
  const superToken = loginRes.data.employeeLogin.accessToken;
  log('👔', 'Employee Login', true, loginRes.data.employeeLogin.employee);
  
  // 2. Customer Authentication
  console.log('\n=== 2. Customer Authentication ===');
  const customerLoginRes = await gql(`
    mutation {
      customerLogin(email: "customer@example.com", password: "customer123") {
        accessToken
        customer { id firstname lastname email }
      }
    }
  `);
  log('👤', 'Customer Login', !customerLoginRes.errors, customerLoginRes.data?.customerLogin?.customer || customerLoginRes.errors);
  
  const customerToken = customerLoginRes.data?.customerLogin?.accessToken;
  
  // Run Modules Tests
  if (customerToken) {
    await testAddressModule(customerToken);
  }
  
  if (superToken) {
    await testCatalogModule(superToken);
    await testCatalogAttributes(superToken);
  }
  
  console.log('\n🎉 All tests completed!\n');
})();
