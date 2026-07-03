import { cookies } from "next/headers";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";

export type Lang = "fr" | "en";
export type T = typeof fr;

export function getLang(): Lang {
  try {
    return (cookies().get("lang")?.value as Lang) ?? "fr";
  } catch {
    return "fr";
  }
}

export function getT(): T {
  return getLang() === "en" ? (en as T) : fr;
}
