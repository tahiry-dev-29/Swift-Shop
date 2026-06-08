#!/bin/bash

API_URL="http://localhost:3000/graphql"

echo "1. Logging in as superadmin..."
LOGIN_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { employeeLogin(email: \"superadmin@dima.com\", password: \"admin123\") { accessToken } }"}')

echo "${LOGIN_RES}"
TOKEN=$(echo "${LOGIN_RES}" | jq -r '.data.employeeLogin.accessToken')

if [[ ${TOKEN} == "null" ]] || [[ -z ${TOKEN} ]]; then
  echo "Login failed. Token is missing."
  exit 1
fi

echo -e "\n2. Generating 2FA Secret..."
SECRET_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"query":"mutation { generate2FASecret { secret qrCodeUrl } }"}')

echo "${SECRET_RES}"
SECRET=$(echo "${SECRET_RES}" | jq -r '.data.generate2FASecret.secret')

if [[ ${SECRET} == "null" ]] || [[ -z ${SECRET} ]]; then
  echo "Generate secret failed."
  exit 1
fi

echo -e "\n3. Generating TOTP code using otplib..."
TOTP=$(bun -e "const { authenticator } = require('otplib'); console.log(authenticator.generate('${SECRET}'));")
echo "Generated TOTP: ${TOTP}"

echo -e "\n4. Enabling 2FA with the generated TOTP..."
ENABLE_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"query\":\"mutation { enable2FA(token: \\\"${TOTP}\\\") }\"}")

echo "${ENABLE_RES}"

echo -e "\n5. Testing login with 2FA enabled (should return requires2FA=true and no accessToken)..."
LOGIN2_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { employeeLogin(email: \"superadmin@dima.com\", password: \"admin123\") { requires2FA accessToken } }"}')

echo "${LOGIN2_RES}"

echo -e "\n6. Testing login with TOTP provided (should succeed with token)..."
TOTP2=$(bun -e "const { authenticator } = require('otplib'); console.log(authenticator.generate('${SECRET}'));")
LOGIN3_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { employeeLogin(email: \\\"superadmin@dima.com\\\", password: \\\"admin123\\\", totp: \\\"${TOTP2}\\\") { accessToken requires2FA } }\"}")

echo "${LOGIN3_RES}"
echo -e "\n7. Testing disable 2FA..."
TOKEN3=$(echo "${LOGIN3_RES}" | jq -r '.data.employeeLogin.accessToken')
DISABLE_RES=$(curl -sS -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN3}" \
  -d "{\"query\":\"mutation { disable2FA(token: \\\"${TOTP2}\\\") }\"}")

echo "${DISABLE_RES}"
