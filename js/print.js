document.addEventListener("DOMContentLoaded", async () => {
  const PRINT_DOCUMENT_TITLE = "CV";
  const storage = window.cvStorage;
  const query = new URLSearchParams(window.location.search);
  const shouldAutoPrint = query.get("autoprint") === "1";
  const printToken = query.get("token") || "";
  const isEmbeddedPrintFrame = window.self !== window.top;
  const elements = {
    manualPrintButton: document.getElementById("manualPrintButton"),
    printSheet: document.querySelector(".printSheet"),
  };

  storage.renderCV(storage.getCVData());
  storage.applyLayoutVersion(storage.getLayoutVersion());
  document.title = PRINT_DOCUMENT_TITLE;

  await window.cvAppUtils.waitForDocumentAssets(document);
  updatePrintMetrics();
  await window.cvAppUtils.waitForNextPaint(window);

  window.addEventListener("afterprint", handleAfterPrint);
  window.addEventListener("resize", updatePrintMetrics);

  if (isEmbeddedPrintFrame && elements.manualPrintButton) {
    elements.manualPrintButton.hidden = true;
  }

  elements.manualPrintButton?.addEventListener("click", () => {
    window.print();
  });

  if (shouldAutoPrint) {
    window.setTimeout(triggerAutoPrint, 0);
  }

  function handleAfterPrint() {
    if (isEmbeddedPrintFrame && window.parent !== window && printToken) {
      window.parent.postMessage(
        {
          type: "cv-print-complete",
          token: printToken,
        },
        "*",
      );
      return;
    }

    if (shouldAutoPrint && window.opener) {
      window.close();
    }
  }

  function triggerAutoPrint() {
    if (isEmbeddedPrintFrame && window.parent !== window && printToken) {
      window.parent.postMessage(
        {
          type: "cv-print-ready",
          token: printToken,
        },
        "*",
      );
      return;
    }

    window.print();
  }

  function updatePrintMetrics() {
    if (!elements.printSheet) {
      return;
    }

    const root = document.documentElement;
    const A4_WIDTH_PX = (210 / 25.4) * 96;
    const A4_HEIGHT_PX = (297 / 25.4) * 96;
    const scaleFromWidth = A4_WIDTH_PX / elements.printSheet.offsetWidth;
    const scaleFromHeight = A4_HEIGHT_PX / elements.printSheet.offsetHeight;
    const scale = Math.min(scaleFromWidth, scaleFromHeight);

    root.style.setProperty("--print-scale", String(scale));
    root.style.setProperty(
      "--print-sheet-width-scaled",
      `${elements.printSheet.offsetWidth * scale}px`,
    );
    root.style.setProperty(
      "--print-sheet-height-scaled",
      `${elements.printSheet.offsetHeight * scale}px`,
    );
  }
});
