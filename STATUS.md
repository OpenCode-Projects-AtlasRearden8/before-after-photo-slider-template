# STATUS.md — before-after-photo-slider-template

Date: 2026-11-07
Owner: Asdale Dynamics, LLC (MIT license, see `LICENSE`)

## What was built

A static GitHub Pages template that pairs two aligned photos with a
drag-handle before/after slider. One page, five example use cases:
home repairs, declutter wins, a full-bleed "cover" comparison, garden
seasons, and FFXIV apartment glow-ups.

- `index.html` — the page shell (keyboard hints, noscript fallback, footer)
- `styles.css` — card/stage styling, contrast-safe labels, focus ring, cover
  full-bleed mode, reduced-motion support
- `sets.js` — the `SETS` configuration array + `validateSets()` guard;
  add a folder here to add a comparison
- `slider.js` — rendering plus interaction: drag (pointer), click-to-move,
  and full keyboard control of a real `role="slider"` handle
- `photo-sets/*` — one starter folder per example, each with a README
- `test/run-tests.mjs` + `test/dom-shim.mjs` — 27 dependency-free tests
- `README.md`, `LICENSE` (MIT), `package.json` (`npm test`)

Image-name convention only: each set folder contains exactly
`before.jpg` and `after.jpg`. No backend, no uploads, no analytics, no
metrics, no external network resources. Ships with no binary placeholder
photos on purpose — missing photos render a friendly notice naming the
expected file instead of a broken page.

## Distinctness from sibling templates

- `event-signup-page-template` = queue (collecting signups)
- `family-photo-album-site-template` = gallery browsing
- this template = a single paired comparison with a draggable wipe

## How to run

```sh
# simplest
python3 -m http.server 8000    # or any static server, then open the page

# tests
npm test                       # or: node test/run-tests.mjs
```

Publishing is plain GitHub Pages on the repo root. No build step exists.

## Verification results

- `npm test` — 27/27 passing. Covers slider math, `SETS` validation, the
  rendered slider structure (via a tiny DOM shim), ARIA slider attributes,
  keyboard handlers, before/after.jpg convention, contrast-safe label
  tokens, clip-path mechanics, missing-photo fallback, noscript, and
  static-site guarantees (no analytics/metrics/network refs, exact MIT
  copyright line, README credit).
- `node --check` on both JS files — clean.
- `python3 -m http.server` — all four assets served with HTTP 200.
- Headless Chrome (`--headless=new --dump-dom`) against the served page:
  5 cards rendered, 5 handles with `aria-valuenow="50"`, all 10 imgs pointed
  at the correct `photo-sets/<folder>/before.jpg|after.jpg` paths, cover
  mode applied to the cover-bleed card, and missing-photo notices rendered
  for each absent placeholder (expected, since the template ships no photos).

## Known gaps

- No real example photos are bundled; the missing-photo notice is the
  intended out-of-the-box state. Drop two aligned JPEGs in each folder to
  see full operation.
- The dependency-free test shim exercises rendering and keyboard logic but
  not pointer-event dragging (headless Chrome verified the render; drag
  behavior follows standard Pointer Events and is worth one manual pass).
- The ARIA handle announces position in English ("50% before, 50% after");
  there is no i18n layer if you fork this for another language.
- Full-bleed cover mode relies on `overflow-x: clip` (modern browsers);
  in older browsers a tiny horizontal scroll guard falls back to nothing.
- No CI pipeline (deliberately zero-dependency; `npm test` is the whole
  story, and there is no lockfile to leak).
