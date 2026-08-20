import assert from "node:assert/strict";
import test from "node:test";
import { normalizeChargeXData, normalizeChargeXStatus } from "../app/lib/live-status/normalize.mjs";
import { isConnectorMatch, isPortMatch, vehicleCatalog } from "../app/data/vehicles.mjs";

test("normalizes ChargeX connector data and only lets an active session override status", () => {
  const parks = { data: [{
    id: "park-1", name: "Test park", geo_lat: "47.9", geo_lng: "106.9",
    stations: [{ id: "station-1", connectors: [
      { id: "port-a", connector_type: "GB/T", current_type: "DC", power_kw: 60, kw_price: 1500, status: "Available" },
      { id: "port-b", connector_type: "CCS Combo Type 2", current_type: "DC", power_kw: 50, kw_price: 1000, status: "Offline" },
    ] }],
  }] };
  const busy = { data: [{
    connector_id: "port-a",
    started_at: "2026-08-20T10:00:00.000Z",
    total_minutes: 30,
    elapsed_minutes: 5,
    remaining_minutes: 25,
  }] };
  const result = normalizeChargeXData(parks, busy);

  assert.equal(result.length, 1);
  assert.equal(result[0].connectors[0].label, "Цэнэглэж байна");
  assert.equal(result[0].connectors[0].code, "charging");
  assert.equal(result[0].connectors[1].label, "Ажиллахгүй");
  assert.equal(result[0].connectors[1].price, 1000);
});

test("does not show queued or expired ChargeX rows as charging", () => {
  const parks = { data: [{
    id: "park-1", name: "Test park", geo_lat: "47.9", geo_lng: "106.9",
    stations: [{ id: "station-1", connectors: [
      { id: "queued", connector_type: "CHAdeMO", current_type: "DC", power_kw: 60, kw_price: 1500, status: "Available" },
      { id: "expired", connector_type: "CCS Combo Type 2", current_type: "DC", power_kw: 60, kw_price: 1500, status: "Available" },
      { id: "faulted", connector_type: "GB/T", current_type: "DC", power_kw: 60, kw_price: 1500, status: "Faulted" },
    ] }],
  }] };
  const busy = { data: [
    { connector_id: "queued", started_at: null, total_minutes: 15, elapsed_minutes: 0, remaining_minutes: 15 },
    { connector_id: "expired", started_at: "2026-08-20T09:00:00.000Z", total_minutes: 15, elapsed_minutes: 30, remaining_minutes: 0 },
    { connector_id: "faulted", started_at: "2026-08-20T10:00:00.000Z", total_minutes: 30, elapsed_minutes: 5, remaining_minutes: 25 },
  ] };

  const connectors = normalizeChargeXData(parks, busy)[0].connectors;
  assert.equal(connectors[0].label, "Сул");
  assert.equal(connectors[1].label, "Сул");
  assert.equal(connectors[2].label, "Гэмтэлтэй");
});

test("uses a safe unknown state instead of presenting unavailable live data as free", () => {
  assert.deepEqual(normalizeChargeXStatus("unexpected"), { code: "unknown", label: "Төлөв тодорхойгүй" });
  assert.deepEqual(normalizeChargeXData({}, {}), []);
});

test("vehicle catalogue covers EV, EREV, and PHEV without asking for a connector", () => {
  const models = vehicleCatalog.flatMap((country) => country.manufacturers.flatMap((maker) => maker.models));
  assert.ok(models.some((model) => model.powertrain === "EV"));
  assert.ok(models.some((model) => model.powertrain === "EREV"));
  assert.ok(models.some((model) => model.powertrain === "PHEV"));
  assert.equal(isConnectorMatch("Type 2 (Mennekes)", ["CCS2", "Type 2 (Mennekes)"]), true);
  assert.equal(isConnectorMatch("CHAdeMO", ["GB/T"]), false);
  const verifiedByd = models.find((model) => model.name.includes("Caribbean / CCS2"));
  assert.ok(verifiedByd);
  assert.equal(verifiedByd.confidence, "verified");
  assert.match(verifiedByd.sourceUrl, /^https:\/\/www\.byd\.com\//);
  assert.equal(isPortMatch("CCS2", "DC", verifiedByd), true);
  assert.equal(isPortMatch("CCS2", "AC", verifiedByd), false);
  assert.equal(isPortMatch("GB/T", "DC", verifiedByd), false);
});
