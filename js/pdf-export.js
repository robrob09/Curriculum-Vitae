(function () {
  const DEFAULT_PDF_DOCUMENT_TITLE = "CV";
  const PRINT_PAGE_URL = "print.html";
  const PRINT_READY_TIMEOUT_MS = 15000;

  async function exportCurrentCvToPdf() {
    await window.cvAppUtils.waitForDocumentAssets(document);

    return withTemporaryDocumentTitle(DEFAULT_PDF_DOCUMENT_TITLE, () =>
      openHiddenPrintFrameAndPrint(),
    );
  }

  async function withTemporaryDocumentTitle(title, callback) {
    const originalTitle = document.title;

    document.title = title;

    try {
      return await callback();
    } finally {
      document.title = originalTitle;
    }
  }

  function openHiddenPrintFrameAndPrint() {
    return new Promise((resolve, reject) => {
      const printToken = `cv-print-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const frame = createPrintFrame(printToken);
      let isSettled = false;
      let timeoutId = 0;

      const cleanup = () => {
        window.removeEventListener("message", handleMessage);

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        frame.remove();
      };

      const finish = (error) => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        cleanup();

        if (error) {
          reject(error);
          return;
        }

        resolve();
      };

      const handleMessage = (event) => {
        const isExpectedFrame = event.source === frame.contentWindow;
        const isExpectedToken = event.data?.token === printToken;

        if (!isExpectedFrame || !isExpectedToken) {
          return;
        }

        if (event.data.type === "cv-print-ready") {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          } catch (error) {
            finish(
              error instanceof Error
                ? error
                : new Error("Failed to open print dialog."),
            );
          }

          return;
        }

        if (event.data.type === "cv-print-complete") {
          finish();
        }
      };

      window.addEventListener("message", handleMessage);

      timeoutId = window.setTimeout(() => {
        finish(new Error("Print frame did not become ready in time."));
      }, PRINT_READY_TIMEOUT_MS);

      document.body.appendChild(frame);
    });
  }

  function createPrintFrame(printToken) {
    const frame = document.createElement("iframe");

    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    frame.src = `${PRINT_PAGE_URL}?autoprint=1&token=${encodeURIComponent(printToken)}`;

    return frame;
  }

  window.cvPdfExport = {
    exportCurrentCvToPdf,
  };
})();
