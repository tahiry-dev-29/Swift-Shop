# 💳 PAYMENT ADAPTERS — Real Integrations

---

## 🎯 Objective

Replace `LocalPaymentAdapter` stubs with real API integrations for each payment gateway.

---

## 🔴 Stripe — Credit Card

- [ ] `StripePaymentAdapter` — implements `PaymentAdapter`
- [ ] `createPaymentIntent` — create payment intent
- [ ] `confirmPayment` — client-side confirmation
- [ ] `webhookHandler` — listen to `payment_intent.succeeded`, `payment_intent.failed`
- [ ] Refund management via Stripe API
- [ ] Stripe Checkout Session for simplified payments
- [ ] Error and timeout handling
- [ ] Unit tests + sandbox mode

---

## 🔴 MVola — Mobile Money Madagascar

- [ ] `MvolaPaymentAdapter` — implements `PaymentAdapter`
- [ ] MVola API: `POST /mvola/api/1.0/transactions/request` (initiate payment)
- [ ] MVola API: `GET /mvola/api/1.0/transactions/status/{serverCorrelationId}` (check status)
- [ ] HMAC signature validation for MVola callbacks
- [ ] Handle MVola callbacks (webhook)
- [ ] Transaction status polling (callback + fallback polling)
- [ ] Refund via MVola API
- [ ] MVola sandbox tests

---

## 🟠 AirtelMoney — Mobile Money Madagascar

- [ ] `AirtelPaymentAdapter` — implements `PaymentAdapter`
- [ ] Airtel Money API: Cash In / Payment request
- [ ] Airtel Money API: Transaction status query
- [ ] Webhook handler Airtel
- [ ] HMAC/Basic Auth for callbacks
- [ ] Status polling (fallback)
- [ ] Refund via Airtel API
- [ ] Airtel sandbox tests

---

## ⚪ PayPal — International Complement

- [ ] `PayPalPaymentAdapter` — implements `PaymentAdapter`
- [ ] PayPal Orders API v2
- [ ] Webhook handler PayPal
- [ ] Refund via PayPal

---

## 🟢 COD & Manual

- [ ] `CodPaymentAdapter` — already stub, verify functionality
- [ ] `ManualPaymentAdapter` — already stub, verify functionality

---

## 🧪 Tests & Validation

- [ ] Unit tests for each adapter
- [ ] Sandbox integration tests (Stripe test keys, MVola sandbox, Airtel sandbox)
- [ ] E2E: complete payment flow → confirmed order
- [ ] Network error handling (retry, timeout, fallback)

---

## 📦 Dependencies

- [x] `stripe` SDK — already installed
- [ ] `axios` for MVola/Airtel HTTP calls
- [ ] Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MVOLA_API_KEY`, `MVOLA_CONSUMER_KEY`, `AIRTEL_API_KEY`, `AIRTEL_API_SECRET`
