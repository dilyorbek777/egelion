// font-provider.tsx
"use client";

import { useEffect, useState, createContext, useContext } from "react";

export type FontFamily = "geometric" | "slab" | "mono" | "bold" | "default";

const FontContext = createContext<{
  font: string;
  setFont: (font: string) => void;
} | null>(null);

export function FontProvider({ 
  children, 
  initialFont = "default" 
}: { 
  children: React.ReactNode;
  initialFont?: string;
}) {
  const [font, setFont] = useState<string>(initialFont);

  useEffect(() => {
    // 1. Read from localStorage on mount
    const savedFont = localStorage.getItem("egelion-font") || "default";
    setFont(savedFont);
    
    // 2. Apply to HTML tag
    document.documentElement.className = `font-${savedFont}`;
  }, []);

  const updateFont = (newFont: string) => {
    setFont(newFont);
    localStorage.setItem("egelion-font", newFont);
    document.documentElement.className = `font-${newFont}`;
  };

  return (
    <FontContext.Provider value={{ font, setFont: updateFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}