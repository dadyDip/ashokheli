"use client";
import { useEffect, useState } from "react";
import { translations } from "./translations";

export function useLang() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved) setLang(saved);
  }, []);

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = translations[lang];

  return { lang, changeLang, t };
}

