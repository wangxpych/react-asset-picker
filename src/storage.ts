import type { AssetPickerValue, RecentStorage } from "./types";

const DEFAULT_STORAGE_KEY = "react-asset-picker:recent";

function isPickerValue(value: unknown): value is AssetPickerValue {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  if (value.type === "emoji" || value.type === "icon") {
    return "value" in value && typeof value.value === "string";
  }
  return (
    value.type === "image" && "url" in value && typeof value.url === "string"
  );
}

export function createLocalStorageRecentStorage(
  key = DEFAULT_STORAGE_KEY,
): RecentStorage {
  return {
    get() {
      if (typeof window === "undefined") return [];
      try {
        const value: unknown = JSON.parse(
          window.localStorage.getItem(key) ?? "[]",
        );
        return Array.isArray(value) ? value.filter(isPickerValue) : [];
      } catch {
        return [];
      }
    },
    set(items) {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(items));
      } catch {
        // Storage can be unavailable in private browsing or locked contexts.
      }
    },
  };
}
