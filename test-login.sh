#!/bin/bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { employeeLogin(email: \"superadmin@dima.com\", password: \"admin123\") { accessToken refreshToken employee { id firstname } } }"
  }'
