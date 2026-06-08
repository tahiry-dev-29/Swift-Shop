const API_URL = 'http://localhost:3000/graphql';

const gql = async (query, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  return res.json();
};

const log = (emoji, name, success, data = null) => {
  console.log(`\n${emoji} ${name}`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};

(async () => {
  console.log('🚀 Testing All GraphQL APIs\n');

  // 1. Employee Login (SuperAdmin)
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

  const token = loginRes.data.employeeLogin.accessToken;
  log('👔', 'Employee Login', true, loginRes.data.employeeLogin.employee);
  console.log(`Token: ${token.substring(0, 30)}...`);

  // 2. Employee Me
  const meRes = await gql(
    `
    query {
      employeeMe {
        id firstname lastname email
        role { id name }
        lastConnectionDate
      }
    }
  `,
    token,
  );
  log(
    '👤',
    'Employee Me',
    !meRes.errors,
    meRes.data?.employeeMe || meRes.errors,
  );

  // 3. Roles CRUD
  console.log('\n=== 2. Roles Management ===');

  // List Roles
  const rolesRes = await gql(
    'query { roles { id name description isSystem } }',
    token,
  );
  log(
    '📋',
    'List Roles',
    !rolesRes.errors,
    rolesRes.data?.roles || rolesRes.errors,
  );

  // Create Role
  const createRoleRes = await gql(
    `
    mutation {
      createRole(input: { name: "MANAGER", description: "Manager access" }) {
        id name description isSystem
      }
    }
  `,
    token,
  );
  log(
    '➕',
    'Create Role',
    !createRoleRes.errors,
    createRoleRes.data?.createRole || createRoleRes.errors,
  );

  const roleId = createRoleRes.data?.createRole?.id;

  if (roleId) {
    // Update Role
    const updateRoleRes = await gql(
      `
      mutation {
        updateRole(id: ${roleId}, input: { description: "Updated Manager" }) {
          id name description
        }
      }
    `,
      token,
    );
    log(
      '✏️',
      'Update Role',
      !updateRoleRes.errors,
      updateRoleRes.data?.updateRole || updateRoleRes.errors,
    );

    // Delete Role
    const deleteRoleRes = await gql(
      `
      mutation {
        deleteRole(id: ${roleId}) { id name }
      }
    `,
      token,
    );
    log(
      '🗑️',
      'Delete Role',
      !deleteRoleRes.errors,
      deleteRoleRes.data?.deleteRole || deleteRoleRes.errors,
    );
  }

  // 4. Employee CRUD
  console.log('\n=== 3. Employee Management ===');

  // List Employees
  const employeesRes = await gql(
    `
    query {
      employees {
        id firstname lastname email
        role { name }
        active
      }
    }
  `,
    token,
  );
  log(
    '📋',
    'List Employees',
    !employeesRes.errors,
    employeesRes.data?.employees || employeesRes.errors,
  );

  // Get Sales Role ID
  const salesRole = rolesRes.data?.roles?.find((r) => r.name === 'SALES');

  if (salesRole) {
    // Create Employee
    const createEmpRes = await gql(
      `
      mutation {
        createEmployee(input: {
          email: "test@dima.com"
          password: "test123"
          firstname: "Test"
          lastname: "User"
          roleId: ${salesRole.id}
        }) {
          id email role { name }
        }
      }
    `,
      token,
    );
    log(
      '➕',
      'Create Employee',
      !createEmpRes.errors,
      createEmpRes.data?.createEmployee || createEmpRes.errors,
    );

    const empId = createEmpRes.data?.createEmployee?.id;

    if (empId) {
      // Get One Employee
      const getEmpRes = await gql(
        `
        query {
          employee(id: ${empId}) {
            id firstname lastname email role { name } active
          }
        }
      `,
        token,
      );
      log(
        '🔍',
        'Get Employee',
        !getEmpRes.errors,
        getEmpRes.data?.employee || getEmpRes.errors,
      );

      // Update Employee
      const updateEmpRes = await gql(
        `
        mutation {
          updateEmployee(id: ${empId}, input: { active: false }) {
            id active
          }
        }
      `,
        token,
      );
      log(
        '✏️',
        'Update Employee',
        !updateEmpRes.errors,
        updateEmpRes.data?.updateEmployee || updateEmpRes.errors,
      );

      // Delete Employee
      const deleteEmpRes = await gql(
        `
        mutation {
          deleteEmployee(id: ${empId}) { id email }
        }
      `,
        token,
      );
      log(
        '🗑️',
        'Delete Employee',
        !deleteEmpRes.errors,
        deleteEmpRes.data?.deleteEmployee || deleteEmpRes.errors,
      );
    }
  }

  // 5. Customer Authentication
  console.log('\n=== 4. Customer Authentication ===');

  const customerLoginRes = await gql(`
    mutation {
      customerLogin(email: "customer@example.com", password: "customer123") {
        accessToken
        customer { id firstname lastname email }
      }
    }
  `);
  log(
    '👤',
    'Customer Login',
    !customerLoginRes.errors,
    customerLoginRes.data?.customerLogin?.customer || customerLoginRes.errors,
  );

  const customerToken = customerLoginRes.data?.customerLogin?.accessToken;

  if (customerToken) {
    // Customer Me
    const customerMeRes = await gql(
      `
      query {
        customerMe { id firstname lastname email active }
      }
    `,
      customerToken,
    );
    log(
      '👤',
      'Customer Me',
      !customerMeRes.errors,
      customerMeRes.data?.customerMe || customerMeRes.errors,
    );
  }

  // Customer Register
  const registerRes = await gql(`
    mutation {
      customerRegister(input: {
        email: "newcust@test.com"
        password: "pass123"
        firstname: "New"
        lastname: "Customer"
        groupId: 1
      }) {
        accessToken
        customer { id email }
      }
    }
  `);
  log(
    '📝',
    'Customer Register',
    !registerRes.errors,
    registerRes.data?.customerRegister?.customer || registerRes.errors,
  );

  // 6. Customer Groups
  console.log('\n=== 5. Customer Groups ===');

  // List Groups
  const groupsRes = await gql(
    'query { customerGroups { id name reduction showPrices } }',
    token,
  );
  log(
    '📋',
    'List Groups',
    !groupsRes.errors,
    groupsRes.data?.customerGroups || groupsRes.errors,
  );

  // Create Group
  const createGroupRes = await gql(
    `
    mutation {
      createCustomerGroup(input: { name: "VIP", reduction: 10.0, showPrices: true }) {
        id name reduction
      }
    }
  `,
    token,
  );
  log(
    '➕',
    'Create Group',
    !createGroupRes.errors,
    createGroupRes.data?.createCustomerGroup || createGroupRes.errors,
  );

  const groupId = createGroupRes.data?.createCustomerGroup?.id;

  if (groupId) {
    // Get One Group
    const getGroupRes = await gql(
      `
      query {
        customerGroup(id: ${groupId}) { id name reduction showPrices }
      }
    `,
      token,
    );
    log(
      '🔍',
      'Get Group',
      !getGroupRes.errors,
      getGroupRes.data?.customerGroup || getGroupRes.errors,
    );

    // Update Group
    const updateGroupRes = await gql(
      `
      mutation {
        updateCustomerGroup(id: ${groupId}, input: { reduction: 15.0 }) {
          id name reduction
        }
      }
    `,
      token,
    );
    log(
      '✏️',
      'Update Group',
      !updateGroupRes.errors,
      updateGroupRes.data?.updateCustomerGroup || updateGroupRes.errors,
    );

    // Delete Group
    const deleteGroupRes = await gql(
      `
      mutation {
        deleteCustomerGroup(id: ${groupId}) { id name }
      }
    `,
      token,
    );
    log(
      '🗑️',
      'Delete Group',
      !deleteGroupRes.errors,
      deleteGroupRes.data?.deleteCustomerGroup || deleteGroupRes.errors,
    );
  }

  console.log('\n🎉 All tests completed!\n');
})();
