import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(
  root,
  "node_modules",
  "emojibase-data",
  "en",
  "compact.json",
);
const target = path.join(root, "src", "data", "emojis.generated.ts");

const raw = JSON.parse(await readFile(source, "utf8"));
const emojis = raw
  .filter(
    (emoji) =>
      Number.isInteger(emoji.group) &&
      Number.isInteger(emoji.order) &&
      typeof emoji.unicode === "string",
  )
  .sort((left, right) => left.order - right.order)
  .map((emoji) => ({
    emoji: emoji.unicode,
    label: emoji.label,
    group: emoji.group,
    keywords: Array.isArray(emoji.tags) ? emoji.tags.slice(0, 12) : [],
  }));

const lines = emojis.map((emoji) => `  ${JSON.stringify(emoji)},`).join("\n");
const output = `/* This file is generated from emojibase-data. Do not edit directly. */\nimport type { EmojiItem } from '../types';\n\nexport const defaultEmojiData: readonly EmojiItem[] = [\n${lines}\n];\n`;

await writeFile(target, output);
