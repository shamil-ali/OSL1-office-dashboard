(function () {
  var PARENT_ORIGIN = window.__STORAGE_ACCESS_PARENT_ORIGIN__ || "*";

  function post(type, extra) {
    if (!window.parent || !window.parent.postMessage) return;
    try {
      window.parent.postMessage(Object.assign({ type: type }, extra || {}), PARENT_ORIGIN);
    } catch (err) {
      console.warn("[storage-access-helper] postMessage failed:", err);
    }
  }

  async function reportAccessState(eventName) {
    if (!document.hasStorageAccess) {
      post(eventName || "STORAGE_ACCESS_AVAILABLE");
      return;
    }
    try {
      var has = await document.hasStorageAccess();
      post(has ? (eventName || "STORAGE_ACCESS_AVAILABLE") : "STORAGE_ACCESS_REQUIRED");
    } catch (err) {
      post("STORAGE_ACCESS_REQUIRED", { reason: err && err.message });
    }
  }

  async function requestAccess() {
    if (!document.requestStorageAccess) {
      post("STORAGE_ACCESS_AVAILABLE");
      return;
    }
    try {
      await document.requestStorageAccess();
      reportAccessState("STORAGE_ACCESS_GRANTED");
    } catch (err) {
      post("STORAGE_ACCESS_REQUIRED", { reason: err && err.message });
    }
  }

  window.addEventListener("message", function (event) {
    if (PARENT_ORIGIN !== "*" && event.origin !== PARENT_ORIGIN) return;
    var data = event.data || {};
    if (data.type === "CHECK_STORAGE_ACCESS") reportAccessState();
    if (data.type === "REQUEST_STORAGE_ACCESS") requestAccess();
  });

  document.addEventListener("DOMContentLoaded", function () {
    reportAccessState();
  });

  window.StorageAccessHelper = {
    setParentOrigin: function (origin) { PARENT_ORIGIN = origin; },
    checkAccess: reportAccessState,
    requestAccess: requestAccess
  };
})();
