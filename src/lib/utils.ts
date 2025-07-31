import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetchWithBaseUrl = async (
  endpoint: string,
  options?: RequestInit,
) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    options,
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};
