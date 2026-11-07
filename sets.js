/*
 * Photo set configuration for the before/after slider template.
 *
 * Image-name convention: every set is a folder containing exactly two files,
 *   before.jpg  -> the "before" photo
 *   after.jpg   -> the "after" photo
 * No backend, no uploads, no metrics. Just drop the two files in the folder.
 *
 * mode: "standard" = side-of-page card; "cover" = full-bleed cover styling.
 * Add, remove, or reorder sets below to match your own folders.
 */
const SETS = [
  {
    id: "home-repair",
    title: "Home repairs",
    description:
      "Fixes and upgrades around the house: the leaky faucet before, the steady stream after.",
    folder: "photo-sets/home-repair",
    mode: "standard"
  },
  {
    id: "declutter",
    title: "Declutter wins",
    description:
      "The drawer, the closet, the garage corner. Same room, way less stuff.",
    folder: "photo-sets/declutter",
    mode: "standard"
  },
  {
    id: "cover-bleed",
    title: "Cover bleed",
    description:
      "Full-bleed edge-to-edge comparison, sized for wide before/after shots.",
    folder: "photo-sets/cover-bleed",
    mode: "cover"
  },
  {
    id: "garden-seasons",
    title: "Garden seasons",
    description:
      "Track a bed across the year: bare soil in spring, jungle by August.",
    folder: "photo-sets/garden-seasons",
    mode: "standard"
  },
  {
    id: "ffxiv-apartment",
    title: "FFXIV apartment glow-ups",
    description:
      "Empty starter room to cozy housing-tour-ready. Screenshot pairs welcome.",
    folder: "photo-sets/ffxiv-apartment",
    mode: "standard"
  }
];

const VALID_MODES = ["standard", "cover"];

function validateSets(sets) {
  if (!Array.isArray(sets)) {
    throw new TypeError("SETS must be an array of set objects.");
  }
  const seen = new Set();
  for (const set of sets) {
    for (const key of ["id", "title", "description", "folder", "mode"]) {
      if (typeof set[key] !== "string" || set[key].length === 0) {
        throw new TypeError(`Set is missing a non-empty "${key}" string: ${JSON.stringify(set)}`);
      }
    }
    if (seen.has(set.id)) {
      throw new TypeError(`Duplicate set id: ${set.id}`);
    }
    seen.add(set.id);
    if (!VALID_MODES.includes(set.mode)) {
      throw new TypeError(`Set "${set.id}" has unknown mode "${set.mode}" (expected standard or cover).`);
    }
    if (set.folder.startsWith("/") || set.folder.endsWith("/")) {
      throw new TypeError(`Set "${set.id}" folder must not start or end with a slash: ${set.folder}`);
    }
  }
  return sets;
}

validateSets(SETS);

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SETS, validateSets, VALID_MODES };
}
