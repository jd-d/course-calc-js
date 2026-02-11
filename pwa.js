(function () {
  const DARK_THEME_COLOR = "#0a0c12";
  const LIGHT_THEME_COLOR = "#eff4ff";
  const SERVICE_WORKER_VERSION = "2026-02-10-v3";
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const SW_UPDATE_TOAST_SESSION_KEY = "course-pricing-sw-update-toast-dismissed";

  function resolveTheme(value) {
    return value === "light" ? "light" : "dark";
  }

  function runWhenBodyReady(task) {
    if (typeof task !== "function") return;
    if (document.body) {
      task();
      return;
    }
    document.addEventListener("DOMContentLoaded", task, { once: true });
  }

  function showServiceWorkerUpdateToast() {
    try {
      if (window.sessionStorage && sessionStorage.getItem(SW_UPDATE_TOAST_SESSION_KEY) === "true") {
        return;
      }
    } catch (error) {
      // Ignore storage access errors.
    }

    runWhenBodyReady(() => {
      if (document.querySelector(".sw-update-toast")) {
        return;
      }

      const toast = document.createElement("div");
      toast.className = "sw-update-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");

      const message = document.createElement("div");
      message.className = "sw-update-toast__message";
      message.textContent = "Update ready. Reload to use the latest version.";

      const actions = document.createElement("div");
      actions.className = "sw-update-toast__actions";

      const reloadButton = document.createElement("button");
      reloadButton.type = "button";
      reloadButton.className = "sw-update-toast__reload";
      reloadButton.textContent = "Reload";
      reloadButton.addEventListener("click", () => {
        window.location.reload();
      });

      const dismissButton = document.createElement("button");
      dismissButton.type = "button";
      dismissButton.className = "sw-update-toast__dismiss";
      dismissButton.textContent = "Dismiss";
      dismissButton.addEventListener("click", () => {
        try {
          if (window.sessionStorage) {
            sessionStorage.setItem(SW_UPDATE_TOAST_SESSION_KEY, "true");
          }
        } catch (error) {
          // Ignore storage access errors.
        }
        toast.remove();
      });

      actions.appendChild(dismissButton);
      actions.appendChild(reloadButton);
      toast.appendChild(message);
      toast.appendChild(actions);
      document.body.appendChild(toast);
    });
  }

  function updateThemeColor(theme) {
    if (!themeColorMeta) {
      return;
    }
    const normalized = resolveTheme(theme);
    const color = normalized === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
    themeColorMeta.setAttribute("content", color);
  }

  document.addEventListener("themechange", (event) => {
    updateThemeColor(event.detail);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      let hadController = Boolean(navigator.serviceWorker.controller);
      const serviceWorkerUrl = new URL(`./service-worker.js?v=${SERVICE_WORKER_VERSION}`, document.baseURI).href;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Don't show an "update ready" toast on first install.
        if (!hadController) {
          hadController = true;
          return;
        }
        showServiceWorkerUpdateToast();
      });

      navigator.serviceWorker
        .register(serviceWorkerUrl, { scope: "./", updateViaCache: "none" })
        .then((registration) => {
          registration.update().catch(() => {});
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    updateThemeColor(document.body.dataset.theme);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      updateThemeColor(document.body.dataset.theme);
    });
  }
})();
