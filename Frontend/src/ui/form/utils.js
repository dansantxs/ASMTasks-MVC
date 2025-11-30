// src/app/setores/ui/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes Tailwind e condicionais.
 * Exemplo: cn("px-4", condition && "bg-blue-500")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}