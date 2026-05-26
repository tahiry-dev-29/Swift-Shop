#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/graphql"

echo -e "${YELLOW}🚀 Testing All GraphQL APIs${NC}\n"

# Function to execute GraphQL query
gql() {
  local query="$1"
  local name="$2"
  echo -e "${YELLOW}Testing: $name${NC}"
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "${AUTH_HEADER}" \
    -d "{\"query\":\"$query\"}")
  
  if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
    echo -e "${RED}❌ FAILED${NC}"
    echo "$response" | jq '.errors'
  else
    echo -e "${GREEN}✅ SUCCESS${NC}"
    echo "$response" | jq '.'
  fi
  echo ""
}

# ============================================
# 1. EMPLOYEE LOGIN (Get SuperAdmin Token)
# ============================================
echo -e "${YELLOW}=== 1. Employee Login (SuperAdmin) ===${NC}"
LOGIN_QUERY='mutation { employeeLogin(email: \"superadmin@dima.com\", password: \"admin123\") { accessToken employee { id firstname lastname email role { id name } } } }'
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$LOGIN_QUERY\"}")

SUPER_ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.employeeLogin.accessToken')

if [ "$SUPER_ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Login SUCCESS - Token: ${SUPER_ADMIN_TOKEN:0:20}...${NC}"
  echo "$LOGIN_RESPONSE" | jq '.data.employeeLogin.employee'
else
  echo -e "${RED}❌ Login FAILED${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi
echo ""

# ============================================
# 2. EMPLOYEE ME
# ============================================
AUTH_HEADER="Authorization: Bearer $SUPER_ADMIN_TOKEN"
gql 'query { employeeMe { id firstname lastname email role { id name } lastConnectionDate } }' "Employee Me (Protected)"

# ============================================
# 3. ROLES CRUD
# ============================================
echo -e "${YELLOW}=== Roles Management ===${NC}"

# List Roles
gql 'query { roles { id name description isSystem } }' "List All Roles"

# Create Role
gql 'mutation { createRole(input: { name: \"MANAGER\", description: \"Manager access\" }) { id name description isSystem } }' "Create Role (MANAGER)"

# Get created role ID
ROLES_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"query":"query { roles { id name } }"}')
MANAGER_ROLE_ID=$(echo "$ROLES_RESPONSE" | jq -r '.data.roles[] | select(.name == "MANAGER") | .id')

if [ "$MANAGER_ROLE_ID" != "null" ] && [ -n "$MANAGER_ROLE_ID" ]; then
  # Update Role
  gql "mutation { updateRole(id: $MANAGER_ROLE_ID, input: { description: \"Updated Manager\" }) { id name description } }" "Update Role"
  
  # Delete Role
  gql "mutation { deleteRole(id: $MANAGER_ROLE_ID) { id name } }" "Delete Role"
fi

# ============================================
# 4. EMPLOYEE CRUD
# ============================================
echo -e "${YELLOW}=== Employee Management ===${NC}"

# List Employees
gql 'query { employees { id firstname lastname email role { name } active } }' "List All Employees"

# Get SALES role ID
SALES_ROLE_ID=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"query":"query { roles { id name } }"}' | jq -r '.data.roles[] | select(.name == "SALES") | .id')

# Create Employee
gql "mutation { createEmployee(input: { email: \"test@dima.com\", password: \"test123\", firstname: \"Test\", lastname: \"User\", roleId: $SALES_ROLE_ID }) { id email role { name } } }" "Create Employee"

# Get created employee ID
EMPLOYEES_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"query":"query { employees { id email } }"}')
TEST_EMPLOYEE_ID=$(echo "$EMPLOYEES_RESPONSE" | jq -r '.data.employees[] | select(.email == "test@dima.com") | .id')

if [ "$TEST_EMPLOYEE_ID" != "null" ] && [ -n "$TEST_EMPLOYEE_ID" ]; then
  # Get One Employee
  gql "query { employee(id: $TEST_EMPLOYEE_ID) { id firstname lastname email role { name } active } }" "Get One Employee"
  
  # Update Employee
  gql "mutation { updateEmployee(id: $TEST_EMPLOYEE_ID, input: { active: false }) { id active } }" "Update Employee"
  
  # Delete Employee
  gql "mutation { deleteEmployee(id: $TEST_EMPLOYEE_ID) { id email } }" "Delete Employee"
fi

# ============================================
# 5. CUSTOMER AUTHENTICATION
# ============================================
echo -e "${YELLOW}=== Customer Authentication ===${NC}"

# Customer Login
CUSTOMER_LOGIN='mutation { customerLogin(email: \"customer@example.com\", password: \"customer123\") { accessToken customer { id firstname lastname email } } }'
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$CUSTOMER_LOGIN\"}")
CUSTOMER_TOKEN=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.customerLogin.accessToken')

if [ "$CUSTOMER_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Customer Login SUCCESS${NC}"
  echo "$CUSTOMER_RESPONSE" | jq '.data.customerLogin.customer'
else
  echo -e "${RED}❌ Customer Login FAILED${NC}"
  echo "$CUSTOMER_RESPONSE" | jq '.'
fi
echo ""

# Customer Me
AUTH_HEADER="Authorization: Bearer $CUSTOMER_TOKEN"
gql 'query { customerMe { id firstname lastname email active } }' "Customer Me (Protected)"

# Customer Register
AUTH_HEADER=""
gql 'mutation { customerRegister(input: { email: \"newcustomer@test.com\", password: \"pass123\", firstname: \"New\", lastname: \"Customer\", groupId: 1 }) { accessToken customer { id email } } }' "Customer Register"

# ============================================
# 6. CUSTOMER GROUPS
# ============================================
echo -e "${YELLOW}=== Customer Groups Management ===${NC}"

# Switch back to SuperAdmin
AUTH_HEADER="Authorization: Bearer $SUPER_ADMIN_TOKEN"

# List Groups
gql 'query { customerGroups { id name reduction showPrices } }' "List Customer Groups"

# Create Group
gql 'mutation { createCustomerGroup(input: { name: \"VIP\", reduction: 10.0, showPrices: true }) { id name reduction } }' "Create Customer Group"

# Get created group ID
GROUPS_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"query":"query { customerGroups { id name } }"}')
VIP_GROUP_ID=$(echo "$GROUPS_RESPONSE" | jq -r '.data.customerGroups[] | select(.name == "VIP") | .id')

if [ "$VIP_GROUP_ID" != "null" ] && [ -n "$VIP_GROUP_ID" ]; then
  # Get One Group
  gql "query { customerGroup(id: $VIP_GROUP_ID) { id name reduction showPrices } }" "Get One Customer Group"
  
  # Update Group
  gql "mutation { updateCustomerGroup(id: $VIP_GROUP_ID, input: { reduction: 15.0 }) { id name reduction } }" "Update Customer Group"
  
  # Delete Group
  gql "mutation { deleteCustomerGroup(id: $VIP_GROUP_ID) { id name } }" "Delete Customer Group"
fi

echo -e "${GREEN}🎉 All tests completed!${NC}"
