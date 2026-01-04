"use client";
import { useState, useEffect } from "react";

export default function PromoShare({ promoCode }) {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/register?promo=${promoCode}`);
    }
  }, [promoCode]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900/60 p-6 rounded-xl border border-emerald-500/20 w-full max-w-lg">
      <div className="flex-1 text-center sm:text-left">
        <p className="text-lg font-semibold text-emerald-400">Your Promo Code:</p>
        <p className="text-xl font-bold mt-1">{promoCode}</p>
      </div>

      <button
        onClick={copyToClipboard}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
      >
        {copied ? "Copied!" : "Copy Code"}
      </button>

      <div className="mt-4 sm:mt-0 text-sm text-gray-400 text-center sm:text-left">
        Share this link with your friends:
        <br />
        <span className="text-emerald-400 break-all cursor-pointer">{shareLink}</span>
      </div>
    </div>
  );
}
