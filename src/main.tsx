import React from "react";
import ReactDOM from "react-dom/client";
import AppPremium from "./AppPremium";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppPremium />
  </React.StrictMode>
);
