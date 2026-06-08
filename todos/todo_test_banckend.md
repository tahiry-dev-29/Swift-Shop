# Backend Auth Test TODO

## Scope

Tests backend a ajouter ou maintenir pour la section `Auth & ACL - Advanced Robustness`.
Le task `Session Fingerprinting` reste exclu.

## Tests deja ajoutes

- [x] `libs/backend/core/auth/src/lib/password-policy.spec.ts`
  - [x] accepte un mot de passe qui respecte les regles locales.
  - [x] rejette un mot de passe trop court.
  - [x] rejette un mot de passe sans symbole.
  - [x] verifie le decoupage SHA1 prefix/suffix pour HaveIBeenPwned.
  - [x] detecte un suffix present dans une reponse range HaveIBeenPwned.

## Tests a completer par fichier

- [ ] `libs/backend/core/auth/src/lib/auth-mail.service.ts`
  - [ ] envoie un payload HTTP complet quand `EMAIL_PROVIDER_API_URL`, `EMAIL_PROVIDER_API_KEY` et `EMAIL_FROM` sont configures.
  - [ ] ignore l'envoi en development quand la configuration email est absente.
  - [ ] leve une erreur en production quand la configuration email est absente.
  - [ ] leve une erreur si le provider email retourne un status HTTP non-2xx.

- [ ] `libs/backend/core/auth/src/lib/auth.service.ts`
  - [ ] `hashPassword` applique la policy locale et HIBP avant Argon2.
  - [ ] `verifyToken` refuse les JWT non-access (`customer_magic_link`, `employee_password_reset`).
  - [ ] `validateCustomer` incremente `failedLoginAttempts` sur mauvais password.
  - [ ] `validateEmployee` incremente `failedLoginAttempts` sur mauvais password.
  - [ ] lockout customer au 5e echec et appelle l'alerte email.
  - [ ] lockout employee au 5e echec et appelle l'alerte email.
  - [ ] reset des compteurs apres login customer reussi.
  - [ ] reset des compteurs apres login employee reussi.
  - [ ] Magic Link expire/refuse un token avec mauvais purpose.
  - [ ] Forced password reset refuse un token avec mauvais purpose.
  - [ ] Device Trust stocke uniquement le hash du token et met a jour `lastUsedAt`.
  - [ ] OAuth2 cree un Customer et un OAuthAccount si le compte provider est nouveau.
  - [ ] OAuth2 retourne le Customer existant si `provider/providerAccountId` existe.

- [ ] `libs/backend/features/customer/src/lib/customer.resolver.ts`
  - [ ] `requestCustomerMagicLink` retourne `{ sent: true }` sans fuite d'existence email.
  - [ ] `requestCustomerMagicLink` construit une URL absolue depuis `x-forwarded-host` et `x-forwarded-proto`.
  - [ ] `requestCustomerMagicLink` appelle l'envoi email.
  - [ ] `customerLoginWithMagicLink` retourne un access token et audite le succes.
  - [ ] `customerOAuth2AuthorizationUrl` retourne une URL PKCE avec `state` et `code_challenge`.
  - [ ] `customerOAuth2Login` retourne un access token et audite le provider.

- [ ] `libs/backend/features/employee/src/lib/employee.resolver.ts`
  - [ ] `employeeLogin` retourne `requires2FA` quand 2FA est active sans TOTP ni trusted device.
  - [ ] `employeeLogin` accepte un trusted device depuis l'argument GraphQL.
  - [ ] `employeeLogin` accepte un trusted device depuis le cookie `dima_trusted_employee_device`.
  - [ ] `employeeLogin` pose le cookie secure/httpOnly quand `rememberDevice` est vrai.
  - [ ] `employeeLogin` retourne `requiresPasswordReset` quand `forcePasswordReset` est vrai.
  - [ ] `completeEmployeeForcedPasswordReset` applique la policy password et retourne un access token.
  - [ ] `enable2FA` refuse un token TOTP invalide.
  - [ ] `disable2FA` supprime secret et flag 2FA apres token valide.

- [ ] `apps/api/src/config/env.validation.ts`
  - [ ] en development, seules `DATABASE_URL` et `JWT_SECRET` sont obligatoires.
  - [ ] en production, les variables email provider sont obligatoires.
  - [ ] en production, les variables OAuth Google/Facebook sont obligatoires.
  - [ ] `PORT` invalide leve une erreur claire.

## Commandes de verification

- [x] `pnpm exec vitest run libs/backend/core/auth/src/lib/password-policy.spec.ts --environment node`
- [x] `bunx nx build api --skip-nx-cache`
