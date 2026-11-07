/*
 * Logic + wiring for the before/after drag-handle slider.
 *
 * The handle is a real ARIA slider: focusable, keyboard-driven, and announced
 * with its current position. Dragging works with mouse, touch, or pen via
 * Pointer Events. Pure functions are exported for the Node test suite.
 */
(function () {
  "use strict";

  const STEP = 5;

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function percentFromPoint(offset, size) {
    if (size <= 0) return 50;
    return clamp((offset / size) * 100, 0, 100);
  }

  function roundPosition(percent) {
    return Math.round(clamp(percent, 0, 100));
  }

  /**
   * Position the handle at `percent` (0 = fully "after", 100 = fully "before").
   * Updates the CSS variable, the ARIA attributes, and the label percents.
   */
  function applyPosition(stage, percent) {
    const p = clamp(percent, 0, 100);

    if (stage && stage.style && typeof stage.style.setProperty === "function") {
      stage.style.setProperty("--ba-pos", p + "%");
    }

    const handle = typeof stage.querySelector === "function" ? stage.querySelector(".ba-handle") : null;
    if (handle) {
      const now = roundPosition(p);
      handle.setAttribute("aria-valuenow", String(now));
      handle.setAttribute("aria-valuetext", now + "% before, " + (100 - now) + "% after");
    }

    const beforePct = stage && stage.querySelector ? stage.querySelector(".ba-pct-before") : null;
    const afterPct = stage && stage.querySelector ? stage.querySelector(".ba-pct-after") : null;
    if (beforePct && afterPct) {
      beforePct.textContent = String(roundPosition(p)) + "%";
      afterPct.textContent = String(100 - roundPosition(p)) + "%";
    }
  }

  /* ---------- DOM helpers (browser only) ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildCard(set) {
    const card = el("section", "ba-card");
    card.setAttribute("aria-labelledby", "ba-title-" + set.id);

    const heading = el("h2", "ba-card-title", set.title);
    heading.id = "ba-title-" + set.id;
    card.appendChild(heading);

    const desc = el("p", "ba-card-desc", set.description);
    card.appendChild(desc);

    const stage = el("figure", "ba-stage ba-stage--" + set.mode);
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-label", "Before and after comparison: " + set.title);
    stage.dataset.folder = set.folder;

    const after = el("img", "ba-img ba-img--after");
    after.src = set.folder + "/after.jpg";
    after.alt = "After: " + set.title;
    after.loading = "lazy";
    after.dataset.expected = set.folder + "/after.jpg";

    const beforeWrap = el("div", "ba-before-wrap");
    const before = el("img", "ba-img ba-img--before");
    before.src = set.folder + "/before.jpg";
    before.alt = "Before: " + set.title;
    before.loading = "lazy";
    before.dataset.expected = set.folder + "/before.jpg";
    beforeWrap.appendChild(before);

    const handle = el("div", "ba-handle");
    handle.setAttribute("role", "slider");
    handle.setAttribute("tabindex", "0");
    handle.setAttribute("aria-orientation", "horizontal");
    handle.setAttribute("aria-label", "Before and after comparison position");
    handle.setAttribute("aria-valuemin", "0");
    handle.setAttribute("aria-valuemax", "100");
    handle.setAttribute("aria-valuenow", "50");
    handle.setAttribute("aria-valuetext", "50% before, 50% after");
    handle.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight Home End");
    const line = el("span", "ba-handle-line");
    line.setAttribute("aria-hidden", "true");
    const grip = el("span", "ba-handle-grip");
    grip.setAttribute("aria-hidden", "true");
    grip.innerHTML =
      '<svg viewBox="0 0 24 16" width="20" height="14" focusable="false" aria-hidden="true">' +
      '<path d="M8 1 3 8l5 7M16 1l5 7-5 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    handle.appendChild(line);
    handle.appendChild(grip);

    const labelBefore = el("span", "ba-label ba-label--before");
    labelBefore.setAttribute("aria-hidden", "true");
    const beforePct = el("span", "ba-pct ba-pct-before", "50%");
    labelBefore.appendChild(document.createTextNode("Before — "));
    labelBefore.appendChild(beforePct);

    const labelAfter = el("span", "ba-label ba-label--after");
    labelAfter.setAttribute("aria-hidden", "true");
    const afterPct = el("span", "ba-pct ba-pct-after", "50%");
    labelAfter.appendChild(document.createTextNode("After — "));
    labelAfter.appendChild(afterPct);

    stage.appendChild(after);
    stage.appendChild(beforeWrap);
    stage.appendChild(handle);
    stage.appendChild(labelBefore);
    stage.appendChild(labelAfter);

    const hint = el("p", "ba-hint");
    hint.appendChild(document.createTextNode("Drag the handle, click anywhere on the photo, or focus the handle and use the arrow keys. Expected files: "));
    hint.appendChild(el("code", "ba-hint-code", set.folder + "/before.jpg"));
    hint.appendChild(document.createTextNode(" and "));
    hint.appendChild(el("code", "ba-hint-code", set.folder + "/after.jpg"));

    card.appendChild(stage);
    card.appendChild(hint);
    return card;
  }

  function markMissing(img) {
    const stage = img.closest(".ba-stage");
    if (!stage) return;
    stage.classList.add("ba-stage--missing");
    const note = el("span", "ba-missing", "Missing photo: " + img.dataset.expected);
    note.setAttribute("role", "note");
    stage.appendChild(note);
  }

  function wireStage(stage) {
    applyPosition(stage, 50);
    stage.querySelectorAll(".ba-img").forEach((img) => {
      img.addEventListener("error", function () {
        markMissing(img);
      });
    });

    let dragging = false;

    const moveToClientX = (clientX) => {
      const rect = stage.getBoundingClientRect();
      applyPosition(stage, percentFromPoint(clientX - rect.left, rect.width));
    };

    stage.addEventListener("pointerdown", (event) => {
      dragging = true;
      stage.setPointerCapture(event.pointerId);
      moveToClientX(event.clientX);
    });

    stage.addEventListener("pointermove", (event) => {
      if (dragging) moveToClientX(event.clientX);
    });

    stage.addEventListener("pointerup", () => {
      dragging = false;
    });

    stage.addEventListener("pointercancel", () => {
      dragging = false;
    });

    const handle = stage.querySelector(".ba-handle");
    handle.addEventListener("keydown", (event) => {
      const current = parseFloat(handle.getAttribute("aria-valuenow") || "50");
      let next = null;
      if (event.key === "ArrowLeft") next = current - STEP;
      else if (event.key === "ArrowRight") next = current + STEP;
      else if (event.key === "PageUp") next = current + STEP * 2;
      else if (event.key === "PageDown") next = current - STEP * 2;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      if (next === null) return;
      event.preventDefault();
      applyPosition(stage, next);
    });
  }

  function renderSets(sets, target) {
    target.textContent = "";
    const frag = document.createDocumentFragment();
    sets.forEach((set) => {
      const card = buildCard(set);
      frag.appendChild(card);
      wireStage(card.querySelector(".ba-stage"));
    });
    target.appendChild(frag);
  }

  if (typeof document !== "undefined") {
    window.addEventListener("DOMContentLoaded", function () {
      const target = document.getElementById("ba-sets");
      if (target) renderSets(SETS, target);
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      clamp,
      percentFromPoint,
      roundPosition,
      applyPosition,
      buildCard,
      renderSets,
      wireStage
    };
  }
})();
