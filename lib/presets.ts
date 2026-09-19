import type { Frame } from "./schema";

export const DEFAULT_FRAMES: Frame[] = [
  { t: "cmd", cmd: "gh auth status" },
  { t: "out", text: "snhsish (mail@snehasish.xyz)" },
  { t: "cmd", cmd: "gh repo list" },
  {
    t: "table",
    title: "",
    headers: ["repo", "stars"],
    rows: [
      ["crosscode", "10"],
      ["mtrx", "1"],
      ["readme-terminal", "15"],
    ],
  },
  { t: "pause", ms: 400 },
  { t: "cmd", cmd: "exit" },
];
