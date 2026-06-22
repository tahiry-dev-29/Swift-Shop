# GraphQL API - customer-oauth.resolver.ts

Ce document contient les exemples d'appels API GraphQL pour les opérations définies dans `customer-oauth.resolver.ts` qu'on peut copier et coller pour tester.

### customerOAuth2AuthorizationUrl

```graphql
mutation CustomerOAuth2AuthorizationUrl($codeChallenge: String!, $provider: String!, $redirectUri: String!, $state: String) {
  customerOAuth2AuthorizationUrl(codeChallenge: $codeChallenge, provider: $provider, redirectUri: $redirectUri, state: $state) {
    authorizationUrl
    state
  }
}
```

**Variables:**

```json
{
  "codeChallenge": "string",
  "provider": "string",
  "redirectUri": "string",
  "state": "string"
}
```

### customerOAuth2Login

```graphql
mutation CustomerOAuth2Login($code: String!, $codeVerifier: String!, $provider: String!, $redirectUri: String!) {
  customerOAuth2Login(code: $code, codeVerifier: $codeVerifier, provider: $provider, redirectUri: $redirectUri) {
    accessToken
    customer {
      active
      birthday
      company
      email
      firstname
      id
      lastname
    }
    refreshToken
  }
}
```

**Variables:**

```json
{
  "code": "string",
  "codeVerifier": "string",
  "provider": "string",
  "redirectUri": "string"
}
```
