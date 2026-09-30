import React from "react";
import ReactDOM from "react-dom/client";
import AppPremium from "./AppPremium";

function isManagerRoute() {
  const path = window.location.pathname;
  return path === "/admin" || path.startsWith("/admin/") || path === "/gestor" || path.startsWith("/gestor/");
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";

        if (scriptUrl.endsWith("/sw.js")) {
          await registration.unregister();
        }
      }

      if (isManagerRoute()) {
        await navigator.serviceWorker.register("/sw-admin.js", { scope: "/gestor/" });
      } else {
        await navigator.serviceWorker.register("/sw-client.js", { scope: "/cliente/" });
      }
    } catch {
      // A PWA continua funcional mesmo se o registro do service worker falhar.
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppPremium />
  </React.StrictMode>
);
