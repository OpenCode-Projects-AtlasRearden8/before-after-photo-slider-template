# Before & After Photo Slider Template

A static GitHub Pages template that pairs two aligned photos with a
drag-handle before/after slider. One page, five example use cases:
home repairs, decluttering wins, full-bleed cover comparisons, garden
seasons, and FFXIV apartment glow-ups.

Built by [Asdale Dynamics, LLC](https://dylanasdale.github.io) — the LLC behind
Dylan Asdale's beginner-friendly AI books and practical tools, including
*The Massive AI Manual*. This template is plain English, too: static files,
no backend, no analytics, no metrics, and nothing to collect.

## How it works

- Every comparison is a **set**: one folder containing exactly two photos,
  named only by convention — `before.jpg` and `after.jpg`.
- Describe your sets at the top of [`sets.js`](sets.js): an `id`, a `title`,
  a short `description`, the `folder`, and a `mode` (`"standard"` card or
  `"cover"` full-bleed).
- That's it. Open `index.html` in a browser or push the folder to GitHub
  Pages. Photos are loaded straight off the page — nothing is uploaded and
  nothing is measured.

The starter folders live under `photo-sets/`:

| Folder | Example use case | Mode |
| --- | --- | --- |
| `photo-sets/home-repair` | Home repairs (leaky faucet before, steady stream after) | standard |
| `photo-sets/declutter` | Declutter wins (drawers, closets, garage corners) | standard |
| `photo-sets/cover-bleed` | Cover bleed (wide comparisons, full bleed edge to edge) | cover |
| `photo-sets/garden-seasons` | Garden seasons (spring soil to August jungle) | standard |
| `photo-sets/ffxiv-apartment` | FFXIV apartment glow-ups (empty starter room to housing-tour ready) | standard |

## Add your own set

1. Create a folder, e.g. `photo-sets/kitchen-remodel/`.
2. Drop in two aligned photos named `before.jpg` and `after.jpg`.
3. Add an entry to the `SETS` array in `sets.js`, for example:

```js
{
  id: "kitchen-remodel",
  title: "Kitchen remodel",
  description: "Same kitchen, new counters.",
  folder: "photo-sets/kitchen-remodel",
  mode: "standard"
}
```

Photos should be the same framing and aspect ratio for the cleanest wipe.
Missing photos don't break the page — the card shows a friendly notice
naming the exact file it expected.

## Accessibility

- The handle is a real ARIA slider (`role="slider"` with `aria-valuemin`,
  `aria-valuemax`, `aria-valuenow`, and spoken `aria-valuetext`).
- Keyboard: focus a handle, then <kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd>
  to nudge, <kbd>PageUp</kbd>/<kbd>PageDown</kbd> for bigger steps,
  <kbd>Home</kbd>/<kbd>End</kbd> to jump to fully after / fully before.
- Labels ("Before —" / "After —") are white text on a dark scrim, which
  keeps contrast safe over any photo; the focus ring is a dark-and-light
  double ring for the same reason.
- Respects `prefers-reduced-motion`; images have descriptive `alt` text;
  the page degrades gracefully without JavaScript.

## Distinct from our other templates

- `event-signup-page-template` collects people into a queue.
- `family-photo-album-site-template` is for gallery browsing.
- This one does one narrow thing well: a **single paired comparison** with a
  draggable wipe. Two photos, one handle, keyboard accessible.

## Run it locally

```sh
# any static file server works — no build step, no dependencies
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html`. To test as GitHub Pages would serve it,
enable Pages on the repo root (Settings → Pages).

## Run the tests

```sh
npm test        # runs the dependency-free Node test suite
# or: node test/run-tests.mjs
```

The tests assert the rendered slider structure (ARIA roles, keyboard
shortcuts, label contrasts, clip-path mechanics), validate the `SETS`
configuration, unit-test the slider math, and check for honesty extras like
absent analytics scripts and no external network references.

## Privacy

No backend. No cookies. No analytics, no metrics, no tracking pixels, and no
network requests beyond your own photos. Keep it that way when you fork it.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.
