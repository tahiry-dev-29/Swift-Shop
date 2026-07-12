# 🚚 SHIPPING ADAPTERS — Real Integrations

## 🎯 Objective

Replace `ManualCarrierAdapter` stubs with real API integrations for tracking and shipping.

---

## 📦 Existing Architecture

- [x] `CarrierAdapter` interface
- [x] `CarrierAdapterRegistry`
- [x] `ManualCarrierAdapter` — base stub
- [ ] Replace each stub with its real adapter

---

## 🇫🇷 Colissimo — La Poste France

- [ ] `ColissimoAdapter` — implements `CarrierAdapter`
- [ ] `generateLabel` — label generation via Colissimo API
- [ ] `trackShipment` — tracking via Colissimo API (status + events)
- [ ] `cancelShipment` — shipment cancellation
- [ ] Map Colissimo statuses → internal system statuses
- [ ] API error handling (timeout, rejection, etc.)
- [ ] Sandbox tests

---

## 🌍 DHL — International

- [ ] `DhlAdapter` — implements `CarrierAdapter`
- [ ] `createShipment` — shipment creation via DHL API
- [ ] `trackShipment` — tracking via DHL API
- [ ] `getRates` — real-time rate retrieval
- [ ] `cancelShipment` — cancellation
- [ ] DHL Developer Portal sandbox tests

---

## 🌍 FedEx — International

- [ ] `FedExAdapter` — implements `CarrierAdapter`
- [ ] `createShipment` — shipment creation via FedEx API
- [ ] `trackShipment` — tracking via FedEx API
- [ ] `getRates` — real-time rates
- [ ] `cancelShipment`
- [ ] FedEx sandbox tests

---

## 🇲🇬 Sodiat — Madagascar (Parcels & Express)

- [ ] `SodiatAdapter` — implements `CarrierAdapter`
- [ ] Sodiat API: waybill creation / tracking
- [ ] `trackShipment` — local status
- [ ] Sodiat tracking number handling
- [ ] Tests (Demo mode / staging if sandbox available)

---

## 🇲🇬 Espace Logistique — Madagascar

- [ ] `EspaceLogistiqueAdapter` — implements `CarrierAdapter`
- [ ] Espace Logistique API: drop-off / tracking
- [ ] `trackShipment` — local status
- [ ] Tests

---

## 🧩 Cross-Cutting Improvements

- [ ] `CarrierAdapter` — add `getRates()` method to interface
- [ ] `ShippingCalculationService` — call real-time rates if available
- [ ] `ShipmentEvent` — enrich events with carrier data
- [ ] Redis cache for rates (1h expiration)
- [ ] Webhook / callback for tracking updates
- [ ] Fallback: if carrier API unavailable, use `ManualCarrierAdapter`

---

## 🧪 Tests & Validation

- [ ] Unit tests for each adapter
- [ ] Sandbox integration tests (Colissimo testing, DHL sandbox, FedEx test)
- [ ] Resilience tests (timeout, API down → fallback manual)
- [ ] Mock HTTP calls for CI tests

---

## 🔐 Environment Variables

```env
COLISSIMO_API_KEY=
COLISSIMO_ACCOUNT_NUMBER=
DHL_API_KEY=
DHL_ACCOUNT_NUMBER=
FEDEX_API_KEY=
FEDEX_ACCOUNT_NUMBER=
SODIAT_API_KEY=
ESPACE_LOGISTIQUE_API_KEY=
```
