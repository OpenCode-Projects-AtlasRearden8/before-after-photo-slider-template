/*
 * Dependency-free test suite for the before/after slider template.
 * Run: node test/run-tests.mjs  (or: npm test)
 *
 * Covers the rendered slider structure, the set configuration, the slider
 * math, and the static-site guarantees (local files only, no analytics).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { SETS, validateSets, VALID_MODES } = require(join(root, "sets.js"));
const {
  clamp,
  percentFromPoint,
  roundPosition,
  applyPosition,
  renderSets
} = require(join(root, "slider.js"));

const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const sliderSrc = readFileSync(join(root, "slider.js"), "utf8");
const setSrc = readFileSync(join(root, "sets.js"), "utf8");
const readme = readFileSync(join(root, "README.md"), "utf8");
const license = readFileSync(join(root, "LICENSE"), "utf8");

let passed = 0;
let failed = 0;

function t(name, fn) {
  try {
    fn();
    console.log(`ok     ${name}`);
    passed++;
  } catch (err) {
    console.log(`FAIL   ${name}\n         ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function throws(fn, errType, message) {
  let didThrow = null;
  try {
    fn();
  } catch (err) {
    didThrow = err;
  }
  assert(didThrow !== null, "expected the call to throw");
  assert(didThrow instanceof errType, `expected ${errType.name}, got ${String(didThrow)}`);
}

function includesAll(haystack, needles, label) {
  for (const needle of needles) {
    assert(
      haystack.includes(needle),
      `${label} is missing: ${JSON.stringify(needle)}`
    );
  }
}

/* ---------- slider math ---------- */

t("clamp keeps positions within 0-100", () => {
  assert(clamp(-10, 0, 100) === 0, "clamp(-10) should be 0");
  assert(clamp(150, 0, 100) === 100, "clamp(150) should be 100");
  assert(clamp(42, 0, 100) === 42, "clamp(42) should be 42");
});

t("percentFromPoint converts a click to 0-100 percent", () => {
  assert(percentFromPoint(25, 100) === 25, "25/100 should be 25");
  assert(percentFromPoint(-5, 100) === 0, "negative offset clamps to 0");
  assert(percentFromPoint(105, 100) === 100, "oversized offset clamps to 100");
  assert(percentFromPoint(50, 0) === 50, "zero-size stage defaults to middle");
  assert(Math.round(percentFromPoint(125, 500)) === 25, "125/500 should be 25");
});

t("roundPosition always returns an integer 0-100", () => {
  assert(roundPosition(49.6) === 50, "49.6 rounds to 50");
  assert(roundPosition(-3) === 0, "negative clamps to 0");
  assert(roundPosition(120) === 100, "over-max clamps to 100");
});

t("applyPosition writes the CSS variable and ARIA values", () => {
  const vars = {};
  const now = {};
  const fakeStage = {
    style: { setProperty: (key, value) => { vars[key] = value; } },
    querySelector: (sel) => {
      if (sel === ".ba-handle") {
        return { setAttribute: (k, v) => { now[k] = v; } };
      }
      return null;
    }
  };
  applyPosition(fakeStage, 68.4);
  assert(vars["--ba-pos"] === "68.4%", "should set --ba-pos to the raw percent");
  assert(now["aria-valuenow"] === "68", "aria-valuenow should round to 68");
  assert(
    now["aria-valuetext"] === "68% before, 32% after",
    "aria-valuetext should read 68% before, 32% after"
  );
  applyPosition(fakeStage, -1);
  assert(now["aria-valuenow"] === "0", "clamped below range becomes 0");
});

/* ---------- set configuration ---------- */

t("SETS covers the five example use cases", () => {
  const ids = SETS.map((s) => s.id);
  for (const expected of [
    "home-repair",
    "declutter",
    "cover-bleed",
    "garden-seasons",
    "ffxiv-apartment"
  ]) {
    assert(ids.includes(expected), `SETS should include "${expected}"`);
  }
  assert(SETS.length >= 5, "should ship at least five example sets");
});

t("every set is valid with the before/after folder convention", () => {
  for (const set of SETS) {
    assert(VALID_MODES.includes(set.mode), `unknown mode on ${set.id}`);
    assert(set.folder.startsWith("photo-sets/"), `${set.id} folder must be under photo-sets/`);
    validateSets([set]); // throws on invalid shape
  }
});

t("validateSets rejects malformed sets", () => {
  throws(() => validateSets({}), TypeError, "non-array should throw");
  throws(
    () =>
      validateSets([
        { id: "x", title: "x", description: "x", folder: "/leading-slash", mode: "standard" }
      ]),
    TypeError,
    "leading slash folder should throw"
  );
  throws(
    () =>
      validateSets([
        { id: "x", title: "x", description: "x", folder: "photo-sets/x", mode: "vertical" }
      ]),
    TypeError,
    "unknown mode should throw"
  );
  throws(
    () =>
      validateSets([SETS[0], Object.assign({}, SETS[0], { folder: "other" })]),
    TypeError,
    "duplicate ids should throw"
  );
});

/* ---------- rendered slider structure ---------- */

t("handle is rendered as an accessible ARIA slider", () => {
  for (const needle of [
    'handle.setAttribute("role", "slider")',
    'handle.setAttribute("tabindex", "0")',
    'handle.setAttribute("aria-orientation", "horizontal")',
    'handle.setAttribute("aria-valuemin", "0")',
    'handle.setAttribute("aria-valuemax", "100")',
    'handle.setAttribute("aria-valuenow", "50")',
    'handle.setAttribute("aria-valuetext", "50% before, 50% after")',
    'handle.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight Home End")'
  ]) {
    assert(
      sliderSrc.includes(needle),
      `slider.js must emit ${needle}`
    );
  }
});

t("keyboard support: arrows, page keys, Home, End", () => {
  for (const key of ["ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"]) {
    assert(
      sliderSrc.includes(`event.key === "${key}"`),
      `keydown handler must support ${key}`
    );
  }
});

t("pointer drag support across mouse, touch, pen", () => {
  for (const ev of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
    assert(
      sliderSrc.includes(`"${ev}"`),
      `stage must handle ${ev}`
    );
  }
  assert(
    css.includes("touch-action: none"),
    "stage must opt out of default touch scrolling"
  );
});

t("labels are contrast-safe: white text on a dark scrim", () => {
  assert(
    /--label-fg:\s*#ffffff/i.test(css),
    "label foreground must be white"
  );
  assert(
    /--label-bg:\s*rgba\(20,\s*19,\s*17,\s*0\.78\)/.test(css),
    "label background must be the near-black scrim"
  );
  assert(
    sliderSrc.includes('"Before — "') && sliderSrc.includes('"After — "'),
    "rendered labels must read Before/After with live percentages"
  );
});

t("before image clips against the drag position", () => {
  assert(
    css.includes("clip-path: inset(0 calc(100% - var(--ba-pos)) 0 0)"),
    "before wrap must clip to the --ba-pos variable"
  );
  assert(
    sliderSrc.includes('setProperty("--ba-pos"'),
    "applyPosition must drive --ba-pos"
  );
});

t("alts and figcaption roles for screen readers", () => {
  assert(
    sliderSrc.includes('"Before: " + set.title') || sliderSrc.includes("Before: "),
    "before image needs a descriptive alt"
  );
  assert(
    sliderSrc.includes('"After: " + set.title') || sliderSrc.includes("After: "),
    "after image needs a descriptive alt"
  );
  assert(
    sliderSrc.includes('aria-label", "Before and after comparison'),
    "stage must be announced as a comparison group"
  );
});

t("missing photos degrade to a friendly notice, not a broken page", () => {
  assert(sliderSrc.includes("addEventListener(\"error\""), "images need error handlers");
  assert(css.includes(".ba-missing"), "styles must cover the missing-photo notice");
});

t("page includes noscript fallback", () => {
  assert(html.includes("<noscript>"), "index.html must include a noscript block");
});

/* ---------- static-site guarantees ---------- */

t("no backend calls, analytics, or metrics anywhere", () => {
  for (const [name, src] of [
    ["sets.js", setSrc],
    ["slider.js", sliderSrc]
  ]) {
    for (const banned of ["fetch(", "XMLHttpRequest", "sendBeacon", "gtag", "googletagmanager", "analytics"]) {
      assert(!src.toLowerCase().includes(banned.toLowerCase()), `${name} must not reference ${banned}`);
    }
  }
  for (const banned of ["<script src=\"https", "googletagmanager", "sendBeacon", "XMLHttpRequest", "fetch("]) {
    assert(
      !html.toLowerCase().includes(banned.toLowerCase()),
      `index.html must not reference ${banned}`
    );
  }
});

t("local-first: no external network resources", () => {
  assert(!/<(?:script|link|img|iframe)[^>]+(src|href)="https?:/i.test(html),
    "no remotely loaded resources allowed (links in prose are fine)");
  for (const asset of ["styles.css", "sets.js", "slider.js"]) {
    assert(html.includes(`"${asset}"`), `index.html must load local asset ${asset}`);
  }
});

t("image-name convention only: before.jpg / after.jpg", () => {
  assert(
    sliderSrc.includes('"/before.jpg"') || sliderSrc.includes('set.folder + "/before.jpg"'),
    "slider must load folder/before.jpg"
  );
  assert(
    sliderSrc.includes('"/after.jpg"') || sliderSrc.includes('set.folder + "/after.jpg"'),
    "slider must load folder/after.jpg"
  );
});

/* ---------- rendered slider structure (live DOM render via tiny shim) ---------- */

import { document as shimDocument, ShimNode as _ShimNode } from "./dom-shim.mjs";

globalThis.document = shimDocument; // slider.js looks for the browser global
const rendered = [];

t("renderSets renders one card per set with a stage group", () => {
  const target = shimDocument.createElement("div");
  renderSets(SETS, target);
  rendered.push(target);
  const cards = target.querySelectorAll(".ba-card");
  assert(cards.length === SETS.length, `expected ${SETS.length} cards, got ${cards.length}`);
  const stage = cards[0].querySelector(".ba-stage");
  assert(stage, "each card must contain a ba-stage");
  assert(stage.getAttribute("role") === "group", "stage must be a group");
  assert(
    (stage.getAttribute("aria-label") || "").includes("Home repairs"),
    "stage aria-label must name the set"
  );
  const coverStage = SETS.map((s, i) => [s, cards[i]]).find(([s]) => s.mode === "cover")[1].querySelector(".ba-stage");
  assert(
    coverStage.classes.includes("ba-stage--cover"),
    "cover-bleed set must use the cover stage mode"
  );
});

t("each rendered card loads the before.jpg / after.jpg convention", () => {
  const target = rendered[0];
  const stages = target.querySelectorAll(".ba-stage");
  stages.forEach((stage, i) => {
    const folder = SETS[i].folder;
    const imgs = stage.querySelectorAll(".ba-img");
    assert(imgs.length === 2, `${folder} stage must render exactly two images`);
    const srcs = imgs.map((img) => img.getAttribute("src"));
    assert(srcs.includes(folder + "/before.jpg"), `${folder} must load before.jpg`);
    assert(srcs.includes(folder + "/after.jpg"), `${folder} must load after.jpg`);
    const before = imgs.find((img) => img.classes.includes("ba-img--before"));
    const after = imgs.find((img) => img.classes.includes("ba-img--after"));
    assert(
      (before.getAttribute("alt") || "").startsWith("Before: "),
      "before image needs a Before: alt"
    );
    assert(
      (after.getAttribute("alt") || "").startsWith("After: "),
      "after image needs an After: alt"
    );
  });
});

t("rendered handle is a 0-100 ARIA slider positioned at 50%", () => {
  const target = rendered[0];
  target.querySelectorAll(".ba-handle").forEach((handle) => {
    assert(handle.getAttribute("role") === "slider", "handle must be role=slider");
    assert(handle.getAttribute("tabindex") === "0", "handle must be focusable");
    assert(handle.getAttribute("aria-valuemin") === "0", "min must be 0");
    assert(handle.getAttribute("aria-valuemax") === "100", "max must be 100");
    assert(handle.getAttribute("aria-valuenow") === "50", "starts at the middle");
    assert(
      (handle.getAttribute("aria-valuetext") || "").includes("before,"),
      "valuetext must describe the split"
    );
  });
});

t("rendered labels show Before / After with live percentages", () => {
  const stage = rendered[0].querySelector(".ba-stage");
  const before = stage.querySelector(".ba-label--before");
  const after = stage.querySelector(".ba-label--after");
  assert(before && after, "both contrast-safe labels must render");
  assert(before.textContent.includes("Before — "), "before label reads Before");
  assert(after.textContent.includes("After — "), "after label reads After");
  assert(before.querySelector(".ba-pct-before").textContent === "50%", "starts at 50%");
});

t("rendered stage wires up the drag-position CSS variable", () => {
  rendered[0].querySelectorAll(".ba-stage").forEach((stage) => {
    assert(
      stage.style.getPropertyValue("--ba-pos") === "50%",
      "wireStage must initialize --ba-pos to 50%"
    );
  });
});

t("keyboard control moves a rendered handle and updates ARIA", () => {
  const stage = rendered[0].querySelector(".ba-stage");
  const handle = stage.querySelector(".ba-handle");
  const key = (k) => handle.fire("keydown", { key: k, preventDefault() {} });

  key("ArrowRight");
  assert(handle.getAttribute("aria-valuenow") === "55", "ArrowRight steps +5 to 55");
  assert(stage.style.getPropertyValue("--ba-pos") === "55%", "position var follows the step");
  assert(
    handle.getAttribute("aria-valuetext") === "55% before, 45% after",
    "valuetext follows the step"
  );

  key("Home");
  assert(handle.getAttribute("aria-valuenow") === "0", "Home jumps to 0");
  key("End");
  assert(handle.getAttribute("aria-valuenow") === "100", "End jumps to 100");
  key("PageDown");
  assert(handle.getAttribute("aria-valuenow") === "90", "PageDown steps -10");

  const beforePct = stage.querySelector(".ba-pct-before");
  const afterPct = stage.querySelector(".ba-pct-after");
  assert(beforePct.textContent === "90%", "before percent label follows the position");
  assert(afterPct.textContent === "10%", "after percent label follows the position");
});

/* ---------- docs + license ---------- */

t("LICENSE is MIT with the exact required copyright line", () => {
  assert(
    license.includes("Copyright (c) 2026 Asdale Dynamics, LLC"),
    "LICENSE must contain 'Copyright (c) 2026 Asdale Dynamics, LLC' exactly"
  );
  assert(license.includes("MIT License"), "LICENSE must be the MIT license");
  assert(!/co-authored-by/i.test(readme + license), "no co-author trailers anywhere");
});

t("README credits Asdale Dynamics, LLC and documents the template", () => {
  assert(readme.includes("Asdale Dynamics, LLC"), "README must credit Asdale Dynamics, LLC");
  for (const heading of ["How it works", "Accessibility", "Run it locally", "Run the tests", "License"]) {
    assert(readme.includes(heading), `README must document ${heading}`);
  }
});

t("README and pages stay honest about the distinct purpose", () => {
  assert(
    readme.includes("event-signup-page-template") && readme.includes("family-photo-album-site-template"),
    "README should explain how this differs from the queue and gallery templates"
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
