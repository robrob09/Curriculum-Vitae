(function () {
  const MATERIAL_WAVE_SELECTOR = [
    ".actionButton",
    ".inlineActionButton",
    ".itemActionButton",
    ".inlineMenuOption",
  ].join(",");

  function clearChildren(node) {
    if (!node) {
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function waitForNextPaint(view = window) {
    return new Promise((resolve) => {
      view.requestAnimationFrame(() => {
        view.requestAnimationFrame(resolve);
      });
    });
  }

  function waitForImages(doc = document) {
    return Promise.all(
      Array.from(doc.images).map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  }

  async function waitForDocumentAssets(doc = document) {
    if (doc.fonts?.ready) {
      try {
        await doc.fonts.ready;
      } catch (error) {
        // Ignore font readiness errors and continue with rendering.
      }
    }

    await waitForImages(doc);

    const view = doc.defaultView || window;
    await waitForNextPaint(view);
    await waitForNextPaint(view);
  }

  function initMaterialWave(doc = document) {
    if (!doc || doc.body?.classList.contains("printPage")) {
      return;
    }

    doc.addEventListener("pointerdown", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const trigger = event.target.closest(MATERIAL_WAVE_SELECTOR);

      if (
        !trigger ||
        trigger.disabled ||
        trigger.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const ripple = doc.createElement("span");
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      ripple.className = "materialWaveRipple";
      ripple.style.setProperty("--wave-size", `${size}px`);
      ripple.style.setProperty("--wave-x", `${x}px`);
      ripple.style.setProperty("--wave-y", `${y}px`);

      trigger.appendChild(ripple);
      ripple.addEventListener(
        "animationend",
        () => {
          ripple.remove();
        },
        { once: true },
      );
    });
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initMaterialWave(document);
    },
    { once: true },
  );

  window.cvAppUtils = {
    clearChildren,
    waitForNextPaint,
    waitForDocumentAssets,
    initMaterialWave,
  };
})();
