import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the EVmap product with the stable task-focused slogan", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visiblePage = html.slice(html.indexOf("<body"), html.indexOf("</main>") + 7);
  assert.match(html, /<title>EVmap Mongolia/);
  assert.match(visiblePage, /<h1><span>EVmap<\/span> Mongolia<\/h1>/);
  assert.match(visiblePage, /Таны машинд тохирох цэнэглэгчийг олъё/);
  assert.match(visiblePage, /aria-label="Станц хайх"/);
  assert.match(visiblePage, /Жагсаалт/);
  assert.match(visiblePage, /23<!-- --> станц/);
});

test("keeps the fixed slogan, compact mobile controls, and reduced-motion safeguards explicit", async () => {
  const [brand, page, css, guide] = await Promise.all([
    readFile(new URL("../app/brand.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../BRAND_GUIDE.md", import.meta.url), "utf8"),
  ]);

  assert.ok(brand.indexOf("sourceNumber: 1") < brand.indexOf("sourceNumber: 2"));
  assert.ok(brand.indexOf("sourceNumber: 2") < brand.indexOf("sourceNumber: 5"));
  assert.match(brand, /Цэнэглэгч хайж, цаг алдахгүй\./);
  assert.match(brand, /Цэнэглэх цэгээ нэг дороос\./);
  assert.match(brand, /EV жолоочийн ухаалаг замын хөтөч\./);

  assert.doesNotMatch(page, /brandTaglines/);
  assert.doesNotMatch(page, /setTaglineIndex/);
  assert.doesNotMatch(page, /7000/);
  assert.match(page, /Таны машинд тохирох цэнэглэгчийг олъё/);
  assert.match(page, /className="mobile-quick-actions"/);
  assert.match(page, />Шүүлтүүр<\/button>/);
  assert.match(page, />Машин\{selectedVehicle \? " ✓" : ""\}<\/button>/);
  assert.match(page, />Жагсаалт<\/button>/);
  assert.match(css, /@keyframes brand-tagline-in/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(guide, /1 → 2 → 5 → 1/);
  assert.match(guide, /зөвхөн нэг баталсан уриа хэрэглэнэ/);
});
