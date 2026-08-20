import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../app/page.tsx", import.meta.url);
const pageSource = await readFile(pagePath, "utf8");

test("keeps the map unselected until the visitor explicitly chooses a station", () => {
  assert.match(pageSource, /useState<string \| null>\(null\)/);
  assert.match(pageSource, /\.on\("click", \(\) => selectStation\(station, true\)\)/);
  assert.match(pageSource, /\{selected && \(/);
});

test("preserves search and the existing AC, DC, and connector filters", () => {
  assert.match(pageSource, /aria-label="Станц хайх"/);
  assert.match(pageSource, /\["ALL", "DC", "AC"\]/);
  assert.match(pageSource, /aria-label="Портын төрлөөр шүүх"/);
  assert.match(pageSource, /matchesSearch && matchesCurrent && matchesConnector/);
});

test("preserves clustering, the station list, and explicit station selection", () => {
  assert.match(pageSource, /markerClusterGroup/);
  assert.match(pageSource, /Жагсаалт · \{filteredStations\.length\}/);
  assert.match(pageSource, /onClick=\{\(\) => selectStation\(station, true\)\}/);
});

test("preserves location, directions, station details, and issue reporting", () => {
  assert.match(pageSource, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(pageSource, /https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(pageSource, /id="station-details"/);
  assert.match(pageSource, /Алдаатай мэдээлэл мэдэгдэх/);
});

test("keeps keyboard and dialog accessibility safeguards", () => {
  assert.match(pageSource, /event\.key === "Escape"/);
  assert.match(pageSource, /event\.key !== "Tab"/);
  assert.match(pageSource, /role="dialog" aria-modal="true"/);
  assert.match(pageSource, /role="dialog" aria-modal="true"/);
});

test("starts near central Ulaanbaatar and only fits distant stations after a filter", () => {
  assert.match(pageSource, /setView\(\[47\.918, 106\.917\], 14\)/);
  assert.match(pageSource, /const shouldFitResults = filtersActive \|\| Boolean\(selectedVehicle\)/);
  assert.match(pageSource, /if \(shouldFitResults && signature !== fittedSignatureRef\.current\)/);
});

test("shows distance and compact mobile controls", () => {
  assert.match(pageSource, /distanceKm\(userLocation, selected\)/);
  assert.match(pageSource, /selectedDistance\.toFixed\(2\)/);
  assert.match(pageSource, /className="mobile-quick-actions"/);
  assert.match(pageSource, /Таны машинд тохирох цэнэглэгчийг олъё/);
});
