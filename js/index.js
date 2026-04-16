document.addEventListener("DOMContentLoaded", () => {
  const storage = window.cvStorage;
  const elements = {
    viewSwitch: document.getElementById("view-switch"),
    savePdfButton: document.getElementById("savePdfButton"),
  };

  const data = storage.getCVData();
  const currentLayoutVersion = storage.getLayoutVersion();

  storage.renderCV(data);
  storage.applyLayoutVersion(currentLayoutVersion);
  syncViewSwitch(currentLayoutVersion);
  bindEvents();

  function bindEvents() {
    elements.viewSwitch?.addEventListener("change", handleViewSwitchChange);
    elements.savePdfButton?.addEventListener("click", handlePdfExport);
  }

  function syncViewSwitch(version) {
    if (!elements.viewSwitch) {
      return;
    }

    elements.viewSwitch.checked = version === "v2";
  }

  function handleViewSwitchChange() {
    if (!elements.viewSwitch) {
      return;
    }

    const nextVersion = elements.viewSwitch.checked ? "v2" : "v1";
    storage.saveLayoutVersion(nextVersion);
    storage.applyLayoutVersion(nextVersion);
  }

  async function handlePdfExport() {
    if (!elements.savePdfButton) {
      return;
    }

    const { savePdfButton } = elements;
    const initialLabel = savePdfButton.textContent;

    savePdfButton.disabled = true;
    savePdfButton.textContent = "Preparing PDF...";

    try {
      await window.cvPdfExport?.exportCurrentCvToPdf?.();
    } catch (error) {
      console.error("Failed to export PDF.", error);
      window.alert("Failed to create PDF. Please try again.");
    } finally {
      savePdfButton.disabled = false;
      savePdfButton.textContent = initialLabel;
    }
  }
});
