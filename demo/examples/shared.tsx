import type { ReactNode } from "react";
import type { AssetPickerValue, RecentStorage } from "../../src";
import { demoIcons } from "../icons";

const iconsById = new Map(demoIcons.map((icon) => [icon.id, icon]));
let recentItems: AssetPickerValue[] = [];

export const demoRecentStorage: RecentStorage = {
  get: () => recentItems,
  set: (items) => {
    recentItems = items;
  },
};

export function fileToDataUrl(
  file: File,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    reader.onload = () => {
      signal.removeEventListener("abort", abort);
      resolve(String(reader.result));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function renderDemoAsset(
  value: AssetPickerValue,
  compact = false,
): ReactNode {
  if (value.type === "emoji") {
    return (
      <span
        className={compact ? "demo-asset-emoji--small" : "demo-asset-emoji"}
      >
        {value.value}
      </span>
    );
  }
  if (value.type === "image") {
    return (
      <img
        className={compact ? "demo-asset-image--small" : "demo-asset-image"}
        src={value.url}
        alt={value.alt ?? "Selected image"}
      />
    );
  }
  return (
    <span
      className={compact ? "demo-asset-icon--small" : "demo-asset-icon"}
      style={{ color: value.color }}
    >
      {iconsById.get(value.value)?.icon}
    </span>
  );
}
