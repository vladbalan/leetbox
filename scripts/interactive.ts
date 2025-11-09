export {};

import * as readline from "node:readline";
import { stdin } from "node:process";

type Key = { name?: string; sequence?: string; ctrl?: boolean };

export async function selectFromList(items: string[], opts?: { title?: string }): Promise<string | undefined> {
  let filter = "";
  let index = 0;

  const original = [...items];

  function filtered(): string[] {
    if (!filter) return original;
    const q = filter.toLowerCase();
    return original.filter((s) => s.toLowerCase().includes(q));
  }

  function render() {
    const list = filtered();
    console.clear();
    console.log((opts?.title ?? "Select an item") + " (↑/↓, type to filter, Backspace, Enter, q)\n");
    console.log(`Filter: ${filter || "<begin typing...>"}\n`);
    if (list.length === 0) {
      console.log("  No matches");
      return;
    }
    // clamp index within bounds
    if (index >= list.length) index = list.length - 1;
    if (index < 0) index = 0;
    list.forEach((p, i) => {
      const cursor = i === index ? ">" : " ";
      const line = `${cursor} ${p}`;
      if (i === index) {
        console.log("\x1b[36m" + line + "\x1b[0m");
      } else {
        console.log(line);
      }
    });
  }

  return new Promise((resolve) => {
    readline.emitKeypressEvents(stdin);
    if (stdin.isTTY) stdin.setRawMode(true);
    if (stdin.resume) stdin.resume();

    const onKeypress = (_str: string, key: Key) => {
      if (!key) return;
      const list = filtered();
      switch (key.name) {
        case "up":
          index = list.length ? (index - 1 + list.length) % list.length : 0;
          render();
          return;
        case "down":
          index = list.length ? (index + 1) % list.length : 0;
          render();
          return;
        case "return":
        case "enter":
          if (!list.length) return; // ignore
          cleanup();
          resolve(list[index]);
          return;
        case "escape":
        case "q":
          cleanup();
          resolve(undefined);
          return;
        case "backspace":
          filter = filter.slice(0, -1);
          index = 0;
          render();
          return;
        default:
          break;
      }
      // Quick numeric jump (1-9)
      if (key.sequence && /^\d$/.test(key.sequence)) {
        const n = parseInt(key.sequence, 10);
        if (n >= 1 && n <= list.length) {
          index = n - 1;
          render();
          return;
        }
      }

      // Add printable characters to filter
      if (key.sequence && key.sequence.length === 1 && !key.ctrl) {
        const ch = key.sequence;
        // ignore control characters
        if (ch >= " " && ch <= "~") {
          filter += ch;
          index = 0;
          render();
          return;
        }
      }
    };

    function cleanup() {
      stdin.removeListener("keypress", onKeypress);
      if (stdin.isTTY) stdin.setRawMode(false);
      if (stdin.pause) stdin.pause();
      console.log("");
    }

    stdin.on("keypress", onKeypress);
    render();
  });
}
