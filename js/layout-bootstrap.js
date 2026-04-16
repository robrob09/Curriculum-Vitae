(function () {
  const LAYOUT_STORAGE_KEY = "cvLayoutVersion";
  const DEFAULT_LAYOUT_VERSION = "v1";

  function normalizeLayoutVersion(version) {
    return version === "v2" ? "v2" : DEFAULT_LAYOUT_VERSION;
  }

  try {
    const savedVersion = localStorage.getItem(LAYOUT_STORAGE_KEY);
    document.documentElement.setAttribute(
      "data-layout-version",
      normalizeLayoutVersion(savedVersion),
    );
  } catch (error) {
    document.documentElement.setAttribute(
      "data-layout-version",
      DEFAULT_LAYOUT_VERSION,
    );
  }
})();
