"use client";

import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    if (localStorage.getItem("installed")) return;

    if (isIOS && !isStandalone) {
      setShow(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    if (prompt) {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem("installed", "true");
        setShow(false);
      }
    } else {
      // iOS fallback: just show message
      alert("Use Share → Add to Home Screen to install this app");
      localStorage.setItem("installed", "true");
      setShow(false);
    }
  };

  return (
    <div className="w-full bg-emerald-700 text-white flex items-center justify-between px-4 py-2 sticky top-16 z-40">
      <div className="flex items-center gap-2">
        <img src="/icon-192.png" alt="RoyalsBet" className="h-8 w-8 rounded" />
        <span className="font-semibold">Install RoyalsBet App</span>
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-emerald-700 px-4 py-1.5 rounded hover:bg-emerald-50 transition"
      >
        Install
      </button>
    </div>
  );
}
