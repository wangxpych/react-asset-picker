import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetPicker } from "../src/AssetPicker";
import type {
  AssetPickerValue,
  EmojiItem,
  IconItem,
  RecentStorage,
} from "../src/types";

const emojis: EmojiItem[] = [
  {
    emoji: "😀",
    label: "grinning face",
    group: 0,
    keywords: ["happy", "smile"],
  },
  {
    emoji: "😂",
    label: "face with tears of joy",
    group: 0,
    keywords: ["laugh"],
  },
];

const icons: IconItem[] = [
  {
    id: "file-text",
    label: "Document",
    keywords: ["page"],
    icon: <svg data-testid="document-icon" />,
  },
];

function memoryStorage(initial: AssetPickerValue[] = []): RecentStorage & {
  value: AssetPickerValue[];
} {
  return {
    value: initial,
    get() {
      return this.value;
    },
    set(items) {
      this.value = items;
    },
  };
}

describe("AssetPicker", () => {
  it("only renders enabled tabs", () => {
    render(<AssetPicker emoji={{ data: emojis }} recent={false} />);

    expect(screen.getByRole("tab", { name: "Emoji" })).toBeVisible();
    expect(
      screen.queryByRole("tab", { name: "Icons" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Upload" }),
    ).not.toBeInTheDocument();
  });

  it("selects an emoji and stores it in recent items", async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    const onValueChange = vi.fn();
    render(
      <AssetPicker
        emoji={{ data: emojis }}
        recent={{ storage }}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "grinning face" }));

    expect(onValueChange).toHaveBeenCalledWith({
      type: "emoji",
      value: "😀",
      label: "grinning face",
    });
    expect(storage.value[0]).toMatchObject({ type: "emoji", value: "😀" });
  });

  it("searches emoji names and keywords", async () => {
    const user = userEvent.setup();
    render(<AssetPicker emoji={{ data: emojis }} recent={false} />);

    await user.type(screen.getByRole("textbox", { name: "Filter…" }), "laugh");

    expect(
      screen.getByRole("button", { name: "face with tears of joy" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "grinning face" }),
    ).not.toBeInTheDocument();
  });

  it("selects injected icons without depending on an icon library", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <AssetPicker
        emoji={false}
        icons={icons}
        recent={false}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Document" }));

    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "icon", value: "file-text" }),
    );
    expect(screen.getByTestId("document-icon")).toBeInTheDocument();
  });

  it("uploads an accepted file through the consumer handler", async () => {
    const user = userEvent.setup();
    const handler = vi.fn().mockResolvedValue({
      url: "https://cdn.example.com/icon.png",
      id: "asset-1",
    });
    const onValueChange = vi.fn();
    const { container } = render(
      <AssetPicker
        emoji={false}
        upload={{ handler, accept: ["image/png"], maxSize: 1024 }}
        recent={false}
        onValueChange={onValueChange}
      />,
    );
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(["png"], "icon.png", { type: "image/png" });
    await user.upload(input!, file);

    await waitFor(() =>
      expect(handler).toHaveBeenCalledWith(file, expect.any(Object)),
    );
    expect(onValueChange).toHaveBeenCalledWith({
      type: "image",
      url: "https://cdn.example.com/icon.png",
      id: "asset-1",
      alt: "icon.png",
    });
  });

  it("revokes only the temporary preview and leaves consumer URLs owned by the host", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.mocked(URL.createObjectURL);
    const revokeObjectURL = vi.mocked(URL.revokeObjectURL);
    createObjectURL.mockReturnValueOnce("blob:internal-preview");
    revokeObjectURL.mockClear();
    const { container, unmount } = render(
      <AssetPicker
        emoji={false}
        upload={{
          handler: async () => ({ url: "blob:consumer-owned-result" }),
        }}
        recent={false}
      />,
    );
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');

    await user.upload(
      input!,
      new File(["png"], "icon.png", { type: "image/png" }),
    );
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:internal-preview"),
    );
    unmount();

    expect(revokeObjectURL).not.toHaveBeenCalledWith(
      "blob:consumer-owned-result",
    );
  });

  it("rejects files larger than the configured maximum", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    const { container } = render(
      <AssetPicker
        emoji={false}
        upload={{ handler, accept: ["image/png"], maxSize: 2 }}
        recent={false}
      />,
    );
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(["too large"], "icon.png", { type: "image/png" });

    await user.upload(input!, file);

    expect(screen.getByRole("alert")).toHaveTextContent("too large");
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes the current value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <AssetPicker
        value={{ type: "emoji", value: "😀" }}
        onValueChange={onValueChange}
        onRemove={onRemove}
        emoji={{ data: emojis }}
        recent={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("supports arrow-key navigation within a grid", async () => {
    const user = userEvent.setup();
    render(<AssetPicker emoji={{ data: emojis }} recent={false} />);
    const grid = screen
      .getByRole("button", { name: "grinning face" })
      .closest("[data-asset-grid]");
    expect(grid).not.toBeNull();
    const buttons = within(grid as HTMLElement).getAllByRole("button");

    buttons[0].focus();
    await user.keyboard("{ArrowRight}");

    expect(buttons[1]).toHaveFocus();
  });
});
