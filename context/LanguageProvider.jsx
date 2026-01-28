"use client";

import { createContext, useContext, useState } from "react";
import en from "@/i18n/en";
import bn from "@/i18n/bn";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en"); // default English
  const t = lang === "en" ? en : bn;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
