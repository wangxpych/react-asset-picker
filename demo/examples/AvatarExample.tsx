import { useState } from "react";
import { Camera, Check } from "lucide-react";
import {
  AssetPicker,
  type AssetPickerTheme,
  type AssetPickerValue,
} from "../../src";
import { demoIcons } from "../icons";
import { demoRecentStorage, fileToDataUrl, renderDemoAsset } from "./shared";

export function AvatarExample({ theme }: { theme: AssetPickerTheme }) {
  const [pickerOpen, setPickerOpen] = useState(true);
  const [value, setValue] = useState<AssetPickerValue | null>({
    type: "emoji",
    value: "🪴",
    label: "potted plant",
  });

  const selectValue = (next: AssetPickerValue | null) => {
    setValue(next);
    setPickerOpen(false);
  };

  return (
    <div
      className={`demo-stage demo-stage--profile${pickerOpen ? " demo-stage--picker-open" : ""}`}
    >
      <section className="demo-profile" aria-label="Avatar and page icon demo">
        <div className="demo-profile-cover" />
        <div className="demo-profile-body">
          <button
            type="button"
            className="demo-profile-avatar"
            aria-label="Change profile identity"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((current) => !current)}
          >
            {value ? renderDemoAsset(value) : <Camera />}
            <span>
              <Camera />
            </span>
          </button>
          <span className="demo-profile-status">
            <Check /> Saved locally
          </span>
          <h2>Your personal workspace</h2>
          <p>Choose an emoji, icon, or image for this profile identity.</p>
          <dl>
            <div>
              <dt>Component</dt>
              <dd>AssetPicker</dd>
            </div>
            <div>
              <dt>Stored value</dt>
              <dd>{value?.type ?? "none"}</dd>
            </div>
            <div>
              <dt>Upload owner</dt>
              <dd>Host application</dd>
            </div>
          </dl>
          <button
            type="button"
            className="demo-change-button"
            onClick={() => setPickerOpen(true)}
          >
            Change identity
          </button>
        </div>
      </section>

      {pickerOpen && (
        <div className="demo-picker-wrap">
          <AssetPicker
            value={value}
            onValueChange={selectValue}
            onRemove={() => selectValue(null)}
            icons={demoIcons}
            recent={{ storage: demoRecentStorage }}
            upload={{
              accept: ["image/png", "image/jpeg", "image/webp"],
              maxSize: 2 * 1024 * 1024,
              allowUrl: true,
              handler: async (file, { signal }) => ({
                url: await fileToDataUrl(file, signal),
                alt: file.name,
              }),
            }}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
