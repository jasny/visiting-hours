"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PrimeReactContext } from "primereact/api";
import { SelectButton } from "primereact/selectbutton";
import { updatePage } from "@/services/pageService"
import Arrow from "@/assets/theme-arrow.svg";
import Image from "next/image"
import { Single_Day } from "next/font/google";

const singleDay = Single_Day({ weight: "400" });

export type VisitTheme = "pink" | "blue" | "green";

function mapVisitToPrime(theme: VisitTheme): string {
  switch (theme) {
    case "blue":
      return "lara-light-blue";
    case "green":
      return "lara-light-teal";
    case "pink":
    default:
      return "lara-light-pink";
  }
}

interface Props {
  reference?: string;
  theme: VisitTheme;
  isAdmin?: boolean;
}

export default function ThemeSwitcher({ reference, theme, isAdmin = false }: Props) {
  const { changeTheme } = useContext(PrimeReactContext);
  const currentRef = useRef<string>("lara-light-pink");
  const [value, setValue] = useState<VisitTheme>(theme);

  // Ensure internal state follows external theme prop
  useEffect(() => {
    setValue(theme);
  }, [theme]);

  // Apply PrimeReact theme and update Tailwind scope attribute
  const applyTheme = (t: VisitTheme) => {
    const next = mapVisitToPrime(t);
    if (typeof changeTheme === "function" && currentRef.current !== next) {
      changeTheme(currentRef.current, next, "theme-link", () => {
        currentRef.current = next;
      });
    }
    // Update Tailwind-scoped data attribute on the visit page root
    try {
      const root = document.querySelector("main[data-visit-theme]");
      if (root) root.setAttribute("data-visit-theme", t);
    } catch {}
  };

  // Sync effects when prop changes
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, changeTheme]);

  // Restore the original PrimeReact theme on unmount
  useEffect(() => {
    return () => {
      const original = "lara-light-pink";
      if (typeof changeTheme === "function" && currentRef.current !== original) {
        try {
          changeTheme(currentRef.current, original, "theme-link", () => {
            currentRef.current = original;
          });
        } catch {}
      }
    };
    // Only depend on changeTheme to avoid re-registering unnecessarily
  }, [changeTheme]);

  // Options for SelectButton with color-only swatches
  const options = useMemo<VisitTheme[]>(() => ["pink", "blue", "green"], []);

  const itemTemplate = (option: VisitTheme) => {
    const colorClass = option === "pink" ? "bg-rose-400" : option === "blue" ? "bg-sky-400" : "bg-teal-400";
    return (
      <span
        className={`inline-block w-5 h-5 rounded-full ${colorClass} border border-black/10`}
        title={option}
        aria-label={option}
      />
    );
  };

  const handleChange = (next: VisitTheme) => {
    setValue(next);
    applyTheme(next);

    if (reference) {
      updatePage(reference, { theme: next }).then();
    }
  };

  // Render selector only for admins; otherwise render nothing
  if (!isAdmin) return null;

  return <>
    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-50">
      <SelectButton
        value={value}
        onChange={(e) => handleChange(e.value as VisitTheme)}
        options={options}
        itemTemplate={itemTemplate}
        allowEmpty={false}
        pt={{
          root: { className: "bg-white/90 backdrop-blur rounded-md p-1 border border-[var(--divider)]" },
          button: { className: "!px-2 !py-2" },
        }}
      />
    </div>
    <div className={`absolute top-20 left-20 z-0 text-gray-800 items-center gap-2 ${singleDay.className} text-2xl hidden md:flex`}>
      <Image src={Arrow} width={128} height={87} alt="Arrow" className="w-[48px]" />
      <span className="relative top-3">in 3 kleuren</span>
    </div>
  </>;
}
