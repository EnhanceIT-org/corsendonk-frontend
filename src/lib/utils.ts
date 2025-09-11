import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetchWithBaseUrl = async (
  endpoint: string,
  options?: RequestInit,
) => {
  const baseUrl = import.meta.env.VITE_API_URL ?? "";
  const normalizedBase = String(baseUrl).replace(/\/+$/g, "");
  const normalizedEndpoint = `/${String(endpoint ?? "").replace(/^\/+/, "")}`;
  const url = `${normalizedBase}${normalizedEndpoint}`;

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};
