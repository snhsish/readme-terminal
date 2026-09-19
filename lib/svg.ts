import type { Frame, Settings } from "./schema";
import { getTheme } from "./themes";

type Seg = { text: string; fill: string; typedAt?: number };
type Line = { segs: Seg[]; appearAt: number; textLength?: number };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tableLines(title: string, headers: [string, string], rows: [string, string][]): string[] {
  const w1 = Math.max(headers[0].length, ...rows.map((r) => r[0].length), 5);
  const w2 = Math.max(headers[1].length, ...rows.map((r) => r[1].length), 5);
  const pad = (s: string, w: number) => " " + s.padEnd(w) + " ";
  const bar = "┌" + "─".repeat(w1 + 2) + "┬" + "─".repeat(w2 + 2) + "┐";
  const mid = "├" + "─".repeat(w1 + 2) + "┼" + "─".repeat(w2 + 2) + "┤";
  const end = "└" + "─".repeat(w1 + 2) + "┴" + "─".repeat(w2 + 2) + "┘";
  const out = title ? [`         ${title}`] : [];
  out.push(bar, `│${pad(headers[0], w1)}│${pad(headers[1], w2)}│`, mid);
  for (const [a, b] of rows) out.push(`│${pad(a, w1)}│${pad(b, w2)}│`);
  out.push(end);
  return out;
}

export function renderTerminalSvg(frames: Frame[], settings: Settings): string {
  const theme = getTheme(settings.theme);
  const fs = settings.fontSize;
  const lh = Math.round(fs * 1.55);
  const charW = fs * 0.6;
  const padX = 24;
  const padY = 20;
  const chromeH = settings.chrome === "none" ? 0 : 38;
  const cps = settings.typingSpeed;

  const promptBase = `${settings.username}:~$`;
  let t = 0.6;
  const lines: Line[] = [];

  for (const f of frames) {
    if (f.t === "pause") {
      t += f.ms / 1000;
    } else if (f.t === "cmd") {
      const prompt = f.prompt ?? promptBase;
      const segs: Seg[] = [
        { text: `${prompt} `, fill: theme.prompt },
      ];
      const start = t;
      const chars = [...f.cmd];
      chars.forEach((ch, i) => {
        segs.push({ text: ch, fill: theme.cmd, typedAt: start + 0.15 + i / cps });
      });
      t += 0.15 + chars.length / cps + 0.25;
      lines.push({ segs, appearAt: start });
    } else if (f.t === "out") {
      for (const raw of f.text.split("\n")) {
        lines.push({
          segs: [{ text: raw || " ", fill: theme.output }],
          appearAt: t,
        });
        t += 0.08;
      }
    } else if (f.t === "table") {
      const rawLines = tableLines(f.title, f.headers, f.rows);
      rawLines.forEach((raw, ri) => {
        const isCaption = ri === 0 && f.title !== "";
        const isNum = /│.*│\s*\d+\s*│/.test(raw);
        lines.push({
          segs: [{ text: raw, fill: isNum ? theme.green : theme.fg }],
          appearAt: t,
          // force exact advance width so box-drawing columns line up
          // even when viewers substitute a different-width fallback font
          textLength: isCaption ? undefined : [...raw].length * charW,
        });
        t += 0.08;
      });
    }
  }
  const totalDur = t + 1.2;

  const cols = Math.max(10, ...lines.map((l) => l.segs.reduce((n, s) => n + [...s.text].length, 0)));
  const width = Math.max(480, Math.ceil(cols * charW + padX * 2));
  const height = Math.ceil(chromeH + padY * 2 + lines.length * lh + 8);

  const textY = (i: number) => chromeH + padY + (i + 1) * lh - 4;

  const texts = lines
    .map((line, li) => {
      const y = textY(li);
      const at = line.appearAt.toFixed(2);
      const tspans = line.segs
        .map((seg) => {
          if (seg.typedAt === undefined) {
            return `<tspan fill="${seg.fill}">${esc(seg.text)}</tspan>`;
          }
          return [...seg.text]
            .map((ch) => {
              const charAt = (seg.typedAt as number).toFixed(2);
              return `<tspan opacity="0" fill="${seg.fill}">${esc(ch)}<set attributeName="opacity" to="1" begin="${charAt}s" /></tspan>`;
            })
            .join("");
        })
        .join("");
      const baseFill = line.segs[0]?.fill ?? theme.fg;
      const force = line.textLength !== undefined
        ? ` textLength="${line.textLength.toFixed(1)}" lengthAdjust="spacingAndGlyphs" xml:space="preserve"`
        : "";
      return `<text x="${padX}" y="${y}" font-family="JetBrains Mono, Menlo, Consolas, monospace" font-size="${fs}" fill="${baseFill}" opacity="0"${force}>${tspans}<set attributeName="opacity" to="1" begin="${at}s" /></text>`;
    })
    .join("\n");

  const cw = fs * 0.6;
  const carets: { x: number; li: number; start: number }[] = [];
  lines.forEach((line, li) => {
    if (!line.segs.length) return;
    const typed = line.segs.some((s) => s.typedAt !== undefined);
    if (!typed) {
      const endX =
        line.textLength !== undefined
          ? padX + line.textLength
          : padX + line.segs.reduce((n, s) => n + [...s.text].length, 0) * charW;
      carets.push({ x: endX, li, start: line.appearAt });
      return;
    }
    let x = padX;
    let prefixDone = false;
    for (const seg of line.segs) {
      if (seg.typedAt === undefined) {
        x += [...seg.text].length * charW;
        continue;
      }
      if (!prefixDone) {
        prefixDone = true;
        carets.push({ x, li, start: line.appearAt });
      }
      for (const ch of [...seg.text]) {
        carets.push({ x, li, start: seg.typedAt });
        x += charW;
        void ch;
      }
    }
  });
  const caretRects = carets
    .map((c, i) => {
      const end = i + 1 < carets.length ? carets[i + 1].start : totalDur;
      const dur = end - c.start;
      if (dur <= 0.001) return "";
      return `<rect x="${c.x.toFixed(1)}" y="${(textY(c.li) - fs).toFixed(1)}" width="${cw.toFixed(1)}" height="${fs + 4}" fill="${theme.fg}" opacity="0"><set attributeName="opacity" to="1" begin="${c.start.toFixed(2)}s" dur="${dur.toFixed(2)}s" /></rect>`;
    })
    .join("");
  const last = carets[carets.length - 1];
  const finalCursor =
    last !== undefined
      ? `<rect x="${last.x.toFixed(1)}" y="${(textY(last.li) - fs).toFixed(1)}" width="${cw.toFixed(1)}" height="${fs + 4}" fill="${theme.fg}" opacity="0"><set attributeName="opacity" to="1" begin="${totalDur.toFixed(2)}s" /><animate attributeName="opacity" values="1;0;1" dur="1s" begin="${totalDur.toFixed(2)}s" repeatCount="${settings.loop ? "indefinite" : "3"}" /></rect>`
      : "";
  const cursor = settings.cursor ? caretRects + finalCursor : "";

  const chrome =
    settings.chrome === "none"
      ? ""
      : `<circle cx="28" cy="19" r="7" fill="#ff5f57"/><circle cx="50" cy="19" r="7" fill="#febc2e"/><circle cx="72" cy="19" r="7" fill="#28c840"/>`;

  const loopEnd = settings.loop
    ? `<set attributeName="opacity" to="1" begin="0s" /><animate attributeName="opacity" values="1;1" dur="${totalDur.toFixed(2)}s" repeatCount="indefinite" />`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${loopEnd}<rect width="100%" height="100%" rx="12" fill="${theme.bg}"/>${chrome}${texts}${cursor}</svg>`;
}
