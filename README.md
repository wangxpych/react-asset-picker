# react-asset-picker

A polished, composable Emoji, Icon, and Image picker for React. Use the same
Notion-inspired picker for chat composers, avatars, page icons, workspace
identity, and other visual assets—without coupling your UI to an icon library or
upload provider.

> Local preview: the package is intentionally private and has not been published
> to npm yet.

## Demo

### Chat composer

![Chat composer example](https://raw.githubusercontent.com/wangxpych/react-asset-picker/main/assets/chat-composer.png)

### Avatar and page icon

![Avatar and page icon example](https://raw.githubusercontent.com/wangxpych/react-asset-picker/main/assets/avatar-page-icon.png)

The repository includes two copyable integrations:

- [Chat composer](demo/examples/ChatComposerExample.tsx): inserts Emoji at the
  text cursor and treats Icon/Image values as attachments
- [Avatar and page icon](demo/examples/AvatarExample.tsx): applies the selected
  asset as a serializable visual identity

Both examples close the popover after selection. That behavior belongs to the
host application; the core picker intentionally owns no open/closed state.

Run the demo locally with Node.js 20+ and pnpm 11:

```bash
pnpm install
pnpm dev
```

Then open <http://127.0.0.1:4173>.

## Features

- Native Emoji 17 data with categories, search, recent items, and random choice
- Consumer-supplied React icons with search and optional color choices
- File selection, drag and drop, preview, MIME/size validation, and cancellation
- Optional image URL input
- Controlled and uncontrolled values with a Remove action
- Keyboard grid navigation and accessible controls
- Light, dark, and system themes with CSS custom properties
- No server, storage provider, CSS framework, or runtime icon-library dependency

## Usage

After the first npm release, the intended installation and API are:

```bash
pnpm add react-asset-picker
```

```tsx
import { useState } from "react";
import { AssetPicker, type AssetPickerValue } from "react-asset-picker";
import "react-asset-picker/styles.css";

function Example() {
  const [value, setValue] = useState<AssetPickerValue | null>(null);

  return (
    <AssetPicker
      value={value}
      onValueChange={setValue}
      onRemove={() => setValue(null)}
      icons={myIcons}
      upload={{
        accept: ["image/png", "image/jpeg", "image/webp"],
        maxSize: 2 * 1024 * 1024,
        handler: async (file, { signal }) => {
          const { url, id } = await uploadFile(file, { signal });
          return { url, id, alt: file.name };
        },
      }}
    />
  );
}
```

Tabs are opt-in: omit `icons` or `upload` and that tab is not rendered.

### Values

Every selection is represented by a serializable discriminated union:

```ts
type AssetPickerValue =
  | { type: "emoji"; value: string; label?: string }
  | { type: "icon"; value: string; label?: string; color?: string }
  | { type: "image"; url: string; id?: string; alt?: string };
```

Icons are injected as React nodes, but only their identifier is returned:

```tsx
const icons = [
  { id: "document", label: "Document", icon: <DocumentIcon /> },
  { id: "agent", label: "Agent", icon: <BotIcon />, keywords: ["ai"] },
];

<AssetPicker icons={icons} onValueChange={setValue} />;
```

### Upload boundary

The package never uploads to a built-in service. It validates the file, shows a
temporary preview, and calls your handler:

```text
File → AssetPicker validation/preview → upload.handler(file)
                                      → OSS / S3 / R2 / API / IndexedDB
                                      → { url, id?, alt? }
```

The host owns credentials, persistence, returned URL lifetime, and remote
cleanup. The local demo uses a data URL, so selected files never leave the
browser.

### Main props

| Prop            | Type                            | Default    | Purpose                        |
| --------------- | ------------------------------- | ---------- | ------------------------------ |
| `value`         | `AssetPickerValue \| null`      | —          | Controlled selected value      |
| `defaultValue`  | `AssetPickerValue \| null`      | —          | Initial uncontrolled value     |
| `onValueChange` | `(value) => void`               | —          | Receives selection and removal |
| `onRemove`      | `() => void`                    | —          | Enables the Remove action      |
| `emoji`         | `boolean \| EmojiConfig`        | `true`     | Enables/configures Emoji       |
| `icons`         | `IconItem[] \| IconConfig`      | —          | Enables injected icons         |
| `upload`        | `UploadConfig`                  | —          | Enables file and URL selection |
| `recent`        | `boolean \| RecentConfig`       | `true`     | Configures recent selections   |
| `theme`         | `"light" \| "dark" \| "system"` | `"system"` | Color scheme                   |
| `labels`        | `Partial<AssetPickerLabels>`    | English    | Overrides UI labels            |

Upload defaults accept PNG, JPEG, WebP, GIF, and SVG up to 5 MiB. The demo uses
a stricter PNG/JPEG/WebP, 2 MiB limit.

### Styling

Import `react-asset-picker/styles.css`, then override CSS variables on a wrapper
or the component root:

```css
.my-picker {
  --rap-accent: #d9730d;
  --rap-radius: 18px;
  --rap-width: 520px;
}
```

## Compatibility

- React 18 and 19
- Modern browsers with native Emoji and `color-mix()` support
- SSR-safe recent storage; browser `localStorage` is used only when available
- ESM and CommonJS builds with TypeScript declarations

## Development

```bash
pnpm check
pnpm pack:check
```

`pnpm check` formats, lints, type-checks, tests, and builds both the library and
demo. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance and
[CHANGELOG.md](CHANGELOG.md) for current work.

## Release status

The source is public on
[GitHub](https://github.com/wangxpych/react-asset-picker), but `package.json`
remains `private: true` at `0.0.0-development`. npm publication, versioning,
tags, and GitHub releases are intentionally deferred until the public API and
demo are approved.

## License

MIT. Emoji metadata is generated from Emojibase; see [NOTICE](NOTICE).
