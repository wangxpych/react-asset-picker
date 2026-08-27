import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Paperclip, Send, Smile, X } from "lucide-react";
import {
  AssetPicker,
  type AssetPickerTheme,
  type AssetPickerValue,
} from "../../src";
import { demoIcons } from "../icons";
import { demoRecentStorage, fileToDataUrl, renderDemoAsset } from "./shared";

interface ChatMessage {
  id: number;
  text: string;
  asset: AssetPickerValue | null;
}

export function ChatComposerExample({ theme }: { theme: AssetPickerTheme }) {
  const [pickerOpen, setPickerOpen] = useState(true);
  const [asset, setAsset] = useState<AssetPickerValue | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "这个通用选择器现在已经接进聊天输入框了。",
      asset: { type: "emoji", value: "👋", label: "waving hand" },
    },
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageIdRef = useRef(2);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    setDraft(`${draft.slice(0, start)}${emoji}${draft.slice(end)}`);
    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + emoji.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  const handlePickerValue = (value: AssetPickerValue | null) => {
    if (!value) {
      setAsset(null);
    } else if (value.type === "emoji") {
      insertEmoji(value.value);
    } else {
      setAsset(value);
    }
    setPickerOpen(false);
  };

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && !asset) return;
    setMessages((current) => [
      ...current,
      { id: messageIdRef.current++, text, asset },
    ]);
    setDraft("");
    setAsset(null);
    setPickerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`demo-stage${pickerOpen ? " demo-stage--picker-open" : ""}`}
    >
      <section className="demo-chat" aria-label="Chat demo">
        <header className="demo-chat-header">
          <span className="demo-avatar">A</span>
          <span>
            <strong>Asset Picker Assistant</strong>
            <small>Local demo · nothing leaves this browser</small>
          </span>
          <i aria-label="Online" />
        </header>

        <div className="demo-messages" aria-live="polite">
          <div className="demo-message demo-message--assistant">
            点笑脸选择 Emoji、Icon 或图片；选择后弹窗会自动关闭。
          </div>
          {messages.map((message) => (
            <div className="demo-message-row" key={message.id}>
              <div className="demo-message demo-message--user">
                {message.asset && (
                  <div className="demo-message-asset">
                    {renderDemoAsset(message.asset)}
                  </div>
                )}
                {message.text && <span>{message.text}</span>}
              </div>
            </div>
          ))}
        </div>

        <form className="demo-composer" onSubmit={sendMessage}>
          {asset && (
            <div className="demo-attachment" aria-label="Message attachment">
              {renderDemoAsset(asset, true)}
              <span>
                <strong>
                  {asset.type === "image"
                    ? (asset.alt ?? "Image")
                    : (asset.label ?? asset.value)}
                </strong>
                <small>{asset.type === "image" ? "Image" : "Icon"}</small>
              </span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAsset(null)}
              >
                <X />
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={draft}
            rows={2}
            aria-label="Message"
            placeholder="Write a message…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onComposerKeyDown}
          />
          <div className="demo-composer-actions">
            <div>
              <button
                type="button"
                className={pickerOpen ? "is-active" : undefined}
                aria-label="Toggle asset picker"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((current) => !current)}
              >
                <Smile />
              </button>
              <button
                type="button"
                aria-label="Open attachments"
                onClick={() => setPickerOpen(true)}
              >
                <Paperclip />
              </button>
            </div>
            <button
              type="submit"
              className="demo-send-button"
              aria-label="Send message"
              disabled={!draft.trim() && !asset}
            >
              <Send />
            </button>
          </div>
        </form>
      </section>

      {pickerOpen && (
        <div className="demo-picker-wrap">
          <AssetPicker
            value={asset}
            onValueChange={handlePickerValue}
            onRemove={() => handlePickerValue(null)}
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
