import type { CSSProperties, ReactNode } from "react";

export type AssetPickerTab = "emoji" | "icons" | "upload";
export type AssetPickerTheme = "light" | "dark" | "system";

export interface EmojiItem {
  emoji: string;
  label: string;
  group: number;
  keywords?: readonly string[];
}

export interface IconItem {
  id: string;
  label: string;
  icon: ReactNode;
  category?: string;
  keywords?: readonly string[];
}

export type AssetPickerValue =
  | {
      type: "emoji";
      value: string;
      label?: string;
    }
  | {
      type: "icon";
      value: string;
      label?: string;
      color?: string;
    }
  | {
      type: "image";
      url: string;
      id?: string;
      alt?: string;
    };

export interface UploadResult {
  url: string;
  id?: string;
  alt?: string;
}

export interface UploadConfig {
  handler: (
    file: File,
    context: { signal: AbortSignal },
  ) => Promise<UploadResult>;
  accept?: readonly string[];
  maxSize?: number;
  allowUrl?: boolean;
}

export interface RecentStorage {
  get: () => AssetPickerValue[] | Promise<AssetPickerValue[]>;
  set: (items: AssetPickerValue[]) => void | Promise<void>;
}

export interface RecentConfig {
  maxItems?: number;
  storage?: RecentStorage;
}

export interface EmojiConfig {
  data?: readonly EmojiItem[];
  groups?: readonly number[];
}

export interface IconConfig {
  items: readonly IconItem[];
  colors?: readonly string[];
}

export interface AssetPickerLabels {
  emoji: string;
  icons: string;
  upload: string;
  remove: string;
  search: string;
  recent: string;
  random: string;
  uploadTitle: string;
  uploadDescription: string;
  uploadButton: string;
  uploading: string;
  urlPlaceholder: string;
  useUrl: string;
  fileTooLarge: string;
  unsupportedFile: string;
  uploadFailed: string;
  noResults: string;
}

export interface AssetPickerProps {
  value?: AssetPickerValue | null;
  defaultValue?: AssetPickerValue | null;
  onValueChange?: (value: AssetPickerValue | null) => void;
  onRemove?: () => void;
  emoji?: boolean | EmojiConfig;
  icons?: readonly IconItem[] | IconConfig;
  upload?: UploadConfig;
  recent?: boolean | RecentConfig;
  defaultTab?: AssetPickerTab;
  theme?: AssetPickerTheme;
  labels?: Partial<AssetPickerLabels>;
  className?: string;
  style?: CSSProperties;
}
