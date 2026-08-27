import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { DEFAULT_ICON_COLORS, DEFAULT_LABELS, EMOJI_GROUPS } from "./constants";
import { defaultEmojiData } from "./data/emojis.generated";
import {
  ImageIcon,
  PaletteIcon,
  SearchIcon,
  ShuffleIcon,
  UploadIcon,
} from "./icons";
import { createLocalStorageRecentStorage } from "./storage";
import type {
  AssetPickerLabels,
  AssetPickerProps,
  AssetPickerTab,
  AssetPickerValue,
  EmojiItem,
  IconConfig,
  IconItem,
  RecentConfig,
  UploadConfig,
} from "./types";
import "./styles.css";

const DEFAULT_MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const DEFAULT_ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const GRID_COLUMNS = 9;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getValueKey(value: AssetPickerValue) {
  if (value.type === "image") return `image:${value.id ?? value.url}`;
  return `${value.type}:${value.value}`;
}

function isSameValue(
  left: AssetPickerValue | null | undefined,
  right: AssetPickerValue,
) {
  return left ? getValueKey(left) === getValueKey(right) : false;
}

function mergeLabels(labels?: Partial<AssetPickerLabels>): AssetPickerLabels {
  return { ...DEFAULT_LABELS, ...labels };
}

function normalizeIcons(
  icons: AssetPickerProps["icons"],
): IconConfig | undefined {
  if (!icons) return undefined;
  return Array.isArray(icons)
    ? { items: icons as readonly IconItem[] }
    : (icons as IconConfig);
}

function normalizeRecent(
  recent: AssetPickerProps["recent"],
): Required<RecentConfig> | null {
  if (recent === false) return null;
  const config = typeof recent === "object" ? recent : {};
  return {
    maxItems: config.maxItems ?? 18,
    storage: config.storage ?? createLocalStorageRecentStorage(),
  };
}

function useControllableValue(
  controlledValue: AssetPickerValue | null | undefined,
  defaultValue: AssetPickerValue | null | undefined,
  onValueChange?: (value: AssetPickerValue | null) => void,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? null,
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = (nextValue: AssetPickerValue | null) => {
    if (!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  return [value, setValue] as const;
}

function useRecentItems(config: Required<RecentConfig> | null) {
  const [items, setItems] = useState<AssetPickerValue[]>([]);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    Promise.resolve(config.storage.get()).then((stored) => {
      if (!cancelled && Array.isArray(stored)) {
        setItems(stored.slice(0, config.maxItems));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  const add = (value: AssetPickerValue) => {
    if (!config) return;
    setItems((current) => {
      const next = [
        value,
        ...current.filter((item) => getValueKey(item) !== getValueKey(value)),
      ].slice(0, config.maxItems);
      void config.storage.set(next);
      return next;
    });
  };

  return [items, add] as const;
}

function handleGridKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
  const grid = event.currentTarget.closest<HTMLElement>("[data-asset-grid]");
  if (!grid) return;
  const buttons = Array.from(
    grid.querySelectorAll<HTMLButtonElement>(
      "button[data-asset-item]:not(:disabled)",
    ),
  );
  const index = buttons.indexOf(event.currentTarget);
  if (index < 0) return;

  let next: number;
  if (event.key === "ArrowRight")
    next = Math.min(index + 1, buttons.length - 1);
  else if (event.key === "ArrowLeft") next = Math.max(index - 1, 0);
  else if (event.key === "ArrowDown")
    next = Math.min(index + GRID_COLUMNS, buttons.length - 1);
  else if (event.key === "ArrowUp") next = Math.max(index - GRID_COLUMNS, 0);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = buttons.length - 1;
  else return;

  event.preventDefault();
  buttons[next]?.focus();
}

interface AssetButtonProps {
  label: string;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick: () => void;
  children: ReactNode;
}

function AssetButton({
  label,
  selected,
  className,
  style,
  onClick,
  children,
}: AssetButtonProps) {
  return (
    <button
      type="button"
      className={cx("rap-item", selected && "rap-item--selected", className)}
      style={style}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      data-asset-item
      onKeyDown={handleGridKeyboard}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface UploadPanelProps {
  config: UploadConfig;
  labels: AssetPickerLabels;
  onUploaded: (value: AssetPickerValue) => void;
}

function UploadPanel({ config, labels, onUploaded }: UploadPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [urlValue, setUrlValue] = useState("");
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef<AbortController | undefined>(undefined);
  const temporaryPreviewRef = useRef<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = config.accept ?? DEFAULT_ACCEPT;
  const maxSize = config.maxSize ?? DEFAULT_MAX_UPLOAD_SIZE;

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (temporaryPreviewRef.current) {
        URL.revokeObjectURL(temporaryPreviewRef.current);
      }
    },
    [],
  );

  const clearTemporaryPreview = () => {
    if (!temporaryPreviewRef.current) return;
    URL.revokeObjectURL(temporaryPreviewRef.current);
    temporaryPreviewRef.current = undefined;
  };

  const acceptsFile = (file: File) =>
    accept.some((type) =>
      type.endsWith("/*")
        ? file.type.startsWith(type.slice(0, -1))
        : file.type === type,
    );

  const uploadFile = async (file: File) => {
    setError(undefined);
    if (!acceptsFile(file)) {
      setError(labels.unsupportedFile);
      return;
    }
    if (file.size > maxSize) {
      setError(labels.fileTooLarge);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    clearTemporaryPreview();
    temporaryPreviewRef.current = URL.createObjectURL(file);
    setPreviewUrl(temporaryPreviewRef.current);
    setUploading(true);

    try {
      const result = await config.handler(file, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const value: AssetPickerValue = {
        type: "image",
        url: result.url,
        id: result.id,
        alt: result.alt ?? file.name,
      };
      clearTemporaryPreview();
      setPreviewUrl(result.url);
      onUploaded(value);
    } catch {
      if (!controller.signal.aborted) setError(labels.uploadFailed);
    } finally {
      if (!controller.signal.aborted) setUploading(false);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const applyImageUrl = () => {
    try {
      const url = new URL(urlValue);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      const value: AssetPickerValue = { type: "image", url: url.toString() };
      clearTemporaryPreview();
      setPreviewUrl(value.url);
      setError(undefined);
      onUploaded(value);
    } catch {
      setError(labels.unsupportedFile);
    }
  };

  return (
    <div className="rap-upload-panel">
      <div
        className={cx("rap-dropzone", uploading && "rap-dropzone--busy")}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img
            className="rap-upload-preview"
            src={previewUrl}
            alt="Upload preview"
          />
        ) : (
          <span className="rap-upload-placeholder">
            <ImageIcon width={30} height={30} />
          </span>
        )}
        <strong>{uploading ? labels.uploading : labels.uploadTitle}</strong>
        <span>{labels.uploadDescription}</span>
        <button
          type="button"
          className="rap-primary-button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon />
          {labels.uploadButton}
        </button>
        <input
          ref={inputRef}
          className="rap-visually-hidden"
          type="file"
          accept={accept.join(",")}
          onChange={onInputChange}
        />
      </div>

      {config.allowUrl !== false && (
        <div className="rap-url-row">
          <input
            value={urlValue}
            aria-label={labels.urlPlaceholder}
            placeholder={labels.urlPlaceholder}
            onChange={(event) => setUrlValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyImageUrl();
            }}
          />
          <button
            type="button"
            disabled={!urlValue.trim()}
            onClick={applyImageUrl}
          >
            {labels.useUrl}
          </button>
        </div>
      )}

      {error && (
        <p className="rap-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AssetPicker({
  value: controlledValue,
  defaultValue,
  onValueChange,
  onRemove,
  emoji = true,
  icons,
  upload,
  recent = true,
  defaultTab,
  theme = "system",
  labels: customLabels,
  className,
  style,
}: AssetPickerProps) {
  const labels = useMemo(() => mergeLabels(customLabels), [customLabels]);
  const emojiConfig = useMemo(
    () => (emoji === false ? null : typeof emoji === "object" ? emoji : {}),
    [emoji],
  );
  const iconConfig = useMemo(() => normalizeIcons(icons), [icons]);
  const recentConfig = useMemo(() => normalizeRecent(recent), [recent]);
  const [value, setValue] = useControllableValue(
    controlledValue,
    defaultValue,
    onValueChange,
  );
  const [recentItems, addRecent] = useRecentItems(recentConfig);
  const tabs = useMemo(() => {
    const available: AssetPickerTab[] = [];
    if (emojiConfig) available.push("emoji");
    if (iconConfig?.items.length) available.push("icons");
    if (upload) available.push("upload");
    return available;
  }, [emojiConfig, iconConfig, upload]);
  const initialTab =
    defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0];
  const [requestedTab, setRequestedTab] = useState<AssetPickerTab | undefined>(
    initialTab,
  );
  const activeTab =
    requestedTab && tabs.includes(requestedTab) ? requestedTab : tabs[0];
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(0);
  const [iconColor, setIconColor] = useState(
    value?.type === "icon"
      ? (value.color ?? DEFAULT_ICON_COLORS[0])
      : DEFAULT_ICON_COLORS[0],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef(new Map<number, HTMLElement>());

  const emojiData = emojiConfig?.data ?? defaultEmojiData;
  const enabledGroups =
    emojiConfig?.groups ?? EMOJI_GROUPS.map((group) => group.id);
  const lowerSearch = search.trim().toLocaleLowerCase();
  const filteredEmojis = useMemo(() => {
    if (!emojiConfig) return [];
    return emojiData.filter((item) => {
      if (!enabledGroups.includes(item.group)) return false;
      if (!lowerSearch) return true;
      return (
        item.emoji.includes(lowerSearch) ||
        item.label.toLocaleLowerCase().includes(lowerSearch) ||
        item.keywords?.some((keyword) =>
          keyword.toLocaleLowerCase().includes(lowerSearch),
        )
      );
    });
  }, [emojiConfig, emojiData, enabledGroups, lowerSearch]);

  const filteredIcons = useMemo(() => {
    if (!iconConfig) return [];
    if (!lowerSearch) return [...iconConfig.items];
    return iconConfig.items.filter(
      (item) =>
        item.label.toLocaleLowerCase().includes(lowerSearch) ||
        item.id.toLocaleLowerCase().includes(lowerSearch) ||
        item.keywords?.some((keyword) =>
          keyword.toLocaleLowerCase().includes(lowerSearch),
        ),
    );
  }, [iconConfig, lowerSearch]);

  const iconsById = useMemo(
    () => new Map(iconConfig?.items.map((item) => [item.id, item]) ?? []),
    [iconConfig],
  );

  const selectValue = (nextValue: AssetPickerValue) => {
    setValue(nextValue);
    addRecent(nextValue);
  };

  const removeValue = () => {
    setValue(null);
    onRemove?.();
  };

  const chooseRandom = () => {
    if (activeTab === "emoji" && filteredEmojis.length) {
      const item =
        filteredEmojis[Math.floor(Math.random() * filteredEmojis.length)];
      selectValue({ type: "emoji", value: item.emoji, label: item.label });
    } else if (activeTab === "icons" && filteredIcons.length) {
      const item =
        filteredIcons[Math.floor(Math.random() * filteredIcons.length)];
      selectValue({
        type: "icon",
        value: item.id,
        label: item.label,
        color: iconColor,
      });
    }
  };

  const renderRecent = (item: AssetPickerValue) => {
    if (item.type === "emoji") {
      return (
        <AssetButton
          key={getValueKey(item)}
          label={item.label ?? item.value}
          selected={isSameValue(value, item)}
          onClick={() => selectValue(item)}
        >
          <span className="rap-emoji">{item.value}</span>
        </AssetButton>
      );
    }
    if (item.type === "icon") {
      const icon = iconsById.get(item.value);
      if (!icon) return null;
      return (
        <AssetButton
          key={getValueKey(item)}
          label={item.label ?? icon.label}
          selected={isSameValue(value, item)}
          style={{ color: item.color ?? iconColor }}
          onClick={() => selectValue(item)}
        >
          <span className="rap-icon">{icon.icon}</span>
        </AssetButton>
      );
    }
    return (
      <AssetButton
        key={getValueKey(item)}
        label={item.alt ?? "Uploaded image"}
        selected={isSameValue(value, item)}
        onClick={() => selectValue(item)}
      >
        <img className="rap-recent-image" src={item.url} alt="" />
      </AssetButton>
    );
  };

  const onScroll = () => {
    const container = scrollRef.current;
    if (!container || search) return;
    let current = enabledGroups[0] ?? 0;
    for (const group of enabledGroups) {
      const element = groupRefs.current.get(group);
      if (element && element.offsetTop <= container.scrollTop + 56)
        current = group;
    }
    setActiveGroup(current);
  };

  const scrollToGroup = (group: number) => {
    const container = scrollRef.current;
    const element = groupRefs.current.get(group);
    if (!container || !element) return;
    container.scrollTo({ top: element.offsetTop - 8, behavior: "smooth" });
    setActiveGroup(group);
  };

  if (!activeTab) return null;

  const tabLabel: Record<AssetPickerTab, string> = {
    emoji: labels.emoji,
    icons: labels.icons,
    upload: labels.upload,
  };
  const colors = iconConfig?.colors ?? DEFAULT_ICON_COLORS;

  return (
    <section
      className={cx("rap-root", className)}
      style={style}
      data-theme={theme}
      aria-label="Asset picker"
    >
      <header className="rap-header">
        <div className="rap-tabs" role="tablist" aria-label="Asset type">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={cx("rap-tab", activeTab === tab && "rap-tab--active")}
              onClick={() => {
                setRequestedTab(tab);
                setSearch("");
              }}
            >
              {tabLabel[tab]}
            </button>
          ))}
        </div>
        {onRemove && (
          <button type="button" className="rap-remove" onClick={removeValue}>
            {labels.remove}
          </button>
        )}
      </header>

      {activeTab !== "upload" && (
        <div className="rap-toolbar">
          <label className="rap-search">
            <SearchIcon />
            <input
              value={search}
              placeholder={labels.search}
              aria-label={labels.search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="rap-tool-button"
            aria-label={labels.random}
            title={labels.random}
            onClick={chooseRandom}
          >
            <ShuffleIcon />
          </button>
          {activeTab === "icons" && (
            <details className="rap-color-picker">
              <summary
                className="rap-tool-button"
                aria-label="Choose icon color"
                style={{ color: iconColor }}
              >
                <PaletteIcon />
              </summary>
              <div className="rap-color-menu">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    aria-pressed={iconColor === color}
                    className={cx(
                      "rap-color-swatch",
                      iconColor === color && "rap-color-swatch--active",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={(event) => {
                      setIconColor(color);
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {activeTab === "upload" && upload ? (
        <UploadPanel config={upload} labels={labels} onUploaded={selectValue} />
      ) : (
        <div className="rap-browser" ref={scrollRef} onScroll={onScroll}>
          {!search && recentItems.length > 0 && (
            <section className="rap-section">
              <h3>{labels.recent}</h3>
              <div className="rap-grid" data-asset-grid>
                {recentItems.map(renderRecent)}
              </div>
            </section>
          )}

          {activeTab === "emoji" &&
            (search ? (
              <section className="rap-section">
                <div className="rap-grid" data-asset-grid>
                  {filteredEmojis.map((item) => (
                    <EmojiAssetButton
                      key={`${item.group}:${item.emoji}`}
                      item={item}
                      selected={value}
                      onSelect={selectValue}
                    />
                  ))}
                </div>
              </section>
            ) : (
              enabledGroups.map((groupId) => {
                const group = EMOJI_GROUPS.find((item) => item.id === groupId);
                const items = filteredEmojis.filter(
                  (item) => item.group === groupId,
                );
                if (!group || items.length === 0) return null;
                return (
                  <section
                    key={groupId}
                    ref={(node) => {
                      if (node) groupRefs.current.set(groupId, node);
                      else groupRefs.current.delete(groupId);
                    }}
                    className="rap-section"
                  >
                    <h3>{group.label}</h3>
                    <div className="rap-grid" data-asset-grid>
                      {items.map((item) => (
                        <EmojiAssetButton
                          key={item.emoji}
                          item={item}
                          selected={value}
                          onSelect={selectValue}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            ))}

          {activeTab === "icons" && (
            <section className="rap-section">
              {!search && <h3>{labels.icons}</h3>}
              <div className="rap-grid" data-asset-grid>
                {filteredIcons.map((item) => {
                  const nextValue: AssetPickerValue = {
                    type: "icon",
                    value: item.id,
                    label: item.label,
                    color: iconColor,
                  };
                  return (
                    <AssetButton
                      key={item.id}
                      label={item.label}
                      selected={isSameValue(value, nextValue)}
                      style={{ color: iconColor }}
                      onClick={() => selectValue(nextValue)}
                    >
                      <span className="rap-icon">{item.icon}</span>
                    </AssetButton>
                  );
                })}
              </div>
            </section>
          )}

          {((activeTab === "emoji" && filteredEmojis.length === 0) ||
            (activeTab === "icons" && filteredIcons.length === 0)) && (
            <div className="rap-empty">{labels.noResults}</div>
          )}
        </div>
      )}

      {activeTab === "emoji" && !search && (
        <footer className="rap-category-bar" aria-label="Emoji categories">
          {EMOJI_GROUPS.filter((group) => enabledGroups.includes(group.id)).map(
            (group) => (
              <button
                key={group.id}
                type="button"
                className={cx(
                  "rap-category-button",
                  activeGroup === group.id && "rap-category-button--active",
                )}
                aria-label={group.label}
                title={group.label}
                onClick={() => scrollToGroup(group.id)}
              >
                {group.symbol}
              </button>
            ),
          )}
        </footer>
      )}
    </section>
  );
}

function EmojiAssetButton({
  item,
  selected,
  onSelect,
}: {
  item: EmojiItem;
  selected: AssetPickerValue | null | undefined;
  onSelect: (value: AssetPickerValue) => void;
}) {
  const value: AssetPickerValue = {
    type: "emoji",
    value: item.emoji,
    label: item.label,
  };
  return (
    <AssetButton
      label={item.label}
      selected={isSameValue(selected, value)}
      onClick={() => onSelect(value)}
    >
      <span className="rap-emoji">{item.emoji}</span>
    </AssetButton>
  );
}
