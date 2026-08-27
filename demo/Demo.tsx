import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { AssetPickerTheme } from "../src";
import { AvatarExample } from "./examples/AvatarExample";
import { ChatComposerExample } from "./examples/ChatComposerExample";

type Example = "chat" | "avatar";

const exampleCopy = {
  chat: {
    kicker: "CHAT COMPOSER · CLOSE ON SELECT",
    title: "Pick it. Type it. Send it.",
    description:
      "Emoji are inserted at the text cursor. Icons and uploaded images become attachments. The host closes the popover after each selection.",
    pills: [
      "Cursor-aware emoji",
      "Icon attachments",
      "Local image upload",
      "Enter to send",
    ],
  },
  avatar: {
    kicker: "PROFILE IDENTITY · SAME CORE PICKER",
    title: "One picker, another context.",
    description:
      "Use exactly the same component for a profile avatar, workspace icon, page identity, or project badge. Selection behavior stays in the host app.",
    pills: [
      "Emoji avatar",
      "Custom icon",
      "Image upload",
      "Serializable value",
    ],
  },
} as const;

export function Demo() {
  const [theme, setTheme] =
    useState<Exclude<AssetPickerTheme, "system">>("light");
  const [example, setExample] = useState<Example>("chat");
  const copy = exampleCopy[example];

  return (
    <main className="demo-page" data-theme={theme}>
      <header className="demo-topbar">
        <a className="demo-brand" href="/" aria-label="React Asset Picker demo">
          <span className="demo-brand-mark">R</span>
          <span>React Asset Picker</span>
          <em>personal open-source preview</em>
        </a>
        <button
          type="button"
          className="demo-theme-button"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          onClick={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </button>
      </header>

      <nav className="demo-example-nav" aria-label="Demo examples">
        <button
          type="button"
          className={example === "chat" ? "is-active" : undefined}
          aria-pressed={example === "chat"}
          onClick={() => setExample("chat")}
        >
          Chat composer
        </button>
        <button
          type="button"
          className={example === "avatar" ? "is-active" : undefined}
          aria-pressed={example === "avatar"}
          onClick={() => setExample("avatar")}
        >
          Avatar & page icon
        </button>
      </nav>

      <section className="demo-hero">
        <div className="demo-copy">
          <span className="demo-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="demo-pills" aria-label="Feature highlights">
            {copy.pills.map((pill) => (
              <span key={pill}>{pill}</span>
            ))}
          </div>
        </div>

        {example === "chat" ? (
          <ChatComposerExample theme={theme} />
        ) : (
          <AvatarExample theme={theme} />
        )}
      </section>

      <footer className="demo-note">
        <span className="demo-note-dot" />
        Uploads stay in this browser. This personal project has no company or
        server dependency.
      </footer>
    </main>
  );
}
