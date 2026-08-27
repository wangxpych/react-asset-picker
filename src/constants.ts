import type { AssetPickerLabels } from "./types";

export const EMOJI_GROUPS = [
  { id: 0, label: "Smileys & people", symbol: "☺" },
  { id: 1, label: "People & body", symbol: "☝" },
  { id: 3, label: "Animals & nature", symbol: "♧" },
  { id: 4, label: "Food & drink", symbol: "♨" },
  { id: 5, label: "Travel & places", symbol: "✈" },
  { id: 6, label: "Activities", symbol: "⚽" },
  { id: 7, label: "Objects", symbol: "♢" },
  { id: 8, label: "Symbols", symbol: "✓" },
  { id: 9, label: "Flags", symbol: "⚑" },
] as const;

export const DEFAULT_ICON_COLORS = [
  "#37352f",
  "#787774",
  "#d9730d",
  "#dfab01",
  "#0f7b6c",
  "#0b6e99",
  "#6940a5",
  "#ad1a72",
  "#e03e3e",
] as const;

export const DEFAULT_LABELS: AssetPickerLabels = {
  emoji: "Emoji",
  icons: "Icons",
  upload: "Upload",
  remove: "Remove",
  search: "Filter…",
  recent: "Recent",
  random: "Pick a random option",
  uploadTitle: "Upload an image",
  uploadDescription: "Choose a square PNG, JPEG, or WebP image.",
  uploadButton: "Choose image",
  uploading: "Uploading…",
  urlPlaceholder: "Paste an image URL…",
  useUrl: "Use image",
  fileTooLarge: "The selected image is too large.",
  unsupportedFile: "This file type is not supported.",
  uploadFailed: "The image could not be uploaded. Please try again.",
  noResults: "No matching items",
};
