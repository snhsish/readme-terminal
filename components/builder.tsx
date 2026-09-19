"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Copy, Plus, Trash2, Check, Globe } from "lucide-react";
import type { Frame, Settings } from "@/lib/schema";
import { DEFAULT_FRAMES } from "@/lib/presets";
import { THEMES } from "@/lib/themes";
import { renderTerminalSvg } from "@/lib/svg";
import { encodeShare, decodeShare } from "@/lib/codec";
import { Button, Card, Field, Select, iconBtn, inputCls } from "./ui";
import { ThemeToggle } from "./theme-toggle";

const DEFAULT_SETTINGS: Settings = {
  theme: "tokyonight",
  typingSpeed: 45,
  fontSize: 14,
  chrome: "mac",
  cursor: true,
  loop: false,
  username: "snhsish",
};

const STORAGE_KEY = "readme-terminal:v1";

function loadInitial(): { frames: Frame[]; settings: Settings } {
  if (typeof window === "undefined") return { frames: DEFAULT_FRAMES, settings: DEFAULT_SETTINGS };
  const q = new URLSearchParams(window.location.search).get("data");
  if (q) {
    try {
      const { frames, settings } = decodeShare(q);
      return { frames, settings: { ...DEFAULT_SETTINGS, ...settings } };
    } catch {
      /* fall through to local backup */
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { frames, settings } = decodeShare(raw);
      return { frames, settings: { ...DEFAULT_SETTINGS, ...settings } };
    }
  } catch {
    /* fall through to defaults */
  }
  return { frames: DEFAULT_FRAMES, settings: DEFAULT_SETTINGS };
}

function GithubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

export function Builder() {
  const [init] = useState(loadInitial);
  const [frames, setFrames] = useState<Frame[]>(init.frames);
  const [settings, setSettings] = useState<Settings>(init.settings);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const svg = useMemo(() => {
    try {
      return renderTerminalSvg(frames, settings);
    } catch {
      return "";
    }
  }, [frames, settings]);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const data = encodeShare(frames, settings);
        localStorage.setItem(STORAGE_KEY, data);
        history.replaceState(null, "", `${location.pathname}?data=${data}`);
      } catch {
        /* quota or encode errors are non-fatal */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [frames, settings]);

  useEffect(() => {
    try {
      previewRef.current?.querySelector("svg")?.setCurrentTime(0);
    } catch {
      /* non-SVG renderers ignore timeline resets */
    }
  }, [svg]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const updateFrame = (i: number, f: Frame) =>
    setFrames((arr) => arr.map((x, j) => (j === i ? f : x)));
  const removeFrame = (i: number) => setFrames((arr) => arr.filter((_, j) => j !== i));
  const addFrame = (t: Frame["t"]) => {
    const f: Frame =
      t === "cmd"
        ? { t: "cmd", cmd: "echo hello" }
        : t === "out"
          ? { t: "out", text: "hello world" }
          : t === "pause"
            ? { t: "pause", ms: 400 }
            : { t: "table", title: "", headers: ["Title", "Count"], rows: [["Stars", "100"]] };
    setFrames((arr) => [...arr, f]);
  };

  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "terminal.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}?data=${encodeShare(frames, settings)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <Card className="shrink-0 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h1 className="text-lg font-bold tracking-tight">readme-terminal</h1>
              <p className="text-sm text-muted-foreground">
                make a tiny terminal animation for your readme. tweak it here, download the
                svg, drop it in your repo.
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <a href="https://github.com/snhsish" target="_blank" rel="noreferrer" aria-label="GitHub" className={iconBtn}><GithubIcon /></a>
              <a href="https://x.com/snhsish" target="_blank" rel="noreferrer" aria-label="X" className={iconBtn}><XIcon /></a>
              <a href="https://sish.work" target="_blank" rel="noreferrer" aria-label="Website" className={iconBtn}><Globe size={15} /></a>
              <ThemeToggle />
            </div>
          </div>
        </Card>
        <Card className="flex min-w-0 flex-col p-4 sm:p-6 lg:min-h-0">
          <div className="mb-3 flex shrink-0 items-center justify-between text-sm text-muted-foreground">
            <span>preview</span>
            <span className="font-mono">{(svg.length / 1024).toFixed(1)} kb</span>
          </div>
          <div ref={previewRef} className="w-full overflow-x-auto rounded-lg lg:min-h-0 lg:flex-1 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full [&>svg]:min-w-[320px]" dangerouslySetInnerHTML={{ __html: svg }} />
        </Card>
        <Card className="shrink-0 p-4">
          <div className="flex gap-2">
            <Button onClick={download}><Download />download svg</Button>
            <Button variant="secondary" onClick={share}>{copied ? <Check /> : <Copy />}{copied ? "copied" : "share link"}</Button>
          </div>
        </Card>
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        <Card className="shrink-0 space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="theme">
              <Select value={settings.theme} onChange={(e) => set("theme", e.target.value)}>
                <optgroup label="dark">
                  {THEMES.filter((t) => t.mode === "dark").map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
                <optgroup label="light">
                  {THEMES.filter((t) => t.mode === "light").map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="username">
              <input className={inputCls} value={settings.username} onChange={(e) => set("username", e.target.value)} />
            </Field>
            <Field label={`typing (${settings.typingSpeed}/s)`}>
              <input type="range" min={5} max={200} value={settings.typingSpeed} onChange={(e) => set("typingSpeed", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
            <Field label={`font (${settings.fontSize}px)`}>
              <input type="range" min={10} max={22} value={settings.fontSize} onChange={(e) => set("fontSize", Number(e.target.value))} className="w-full accent-primary" />
            </Field>
            <Field label="chrome">
              <Select value={settings.chrome} onChange={(e) => set("chrome", e.target.value as Settings["chrome"])}>
                <option value="mac">mac</option>
                <option value="linux">linux</option>
                <option value="none">none</option>
              </Select>
            </Field>
            <div className="flex items-end gap-4 pb-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={settings.cursor} onChange={(e) => set("cursor", e.target.checked)} className="accent-primary" />cursor</label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={settings.loop} onChange={(e) => set("loop", e.target.checked)} className="accent-primary" />loop</label>
            </div>
          </div>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3 p-4 lg:min-h-0">
          <div className="shrink-0 space-y-2">
            <h2 className="text-sm font-semibold">frames ({frames.length}/30)</h2>
            <div className="grid grid-cols-4 gap-1">
              {(["cmd", "out", "pause", "table"] as const).map((t) => (
                <Button key={t} size="sm" variant="outline" onClick={() => addFrame(t)}><Plus />{t}</Button>
              ))}
            </div>
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
            {frames.map((f, i) => (
              <div key={i} className="rounded-lg border p-2.5">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">{i + 1}. {f.t}</span>
                  <button onClick={() => removeFrame(i)} className="cursor-pointer hover:text-destructive"><Trash2 size={14} /></button>
                </div>
                {f.t === "cmd" && (
                  <input className={inputCls} value={f.cmd} onChange={(e) => updateFrame(i, { ...f, cmd: e.target.value })} placeholder="whoami" />
                )}
                {f.t === "out" && (
                  <textarea className={inputCls} rows={2} value={f.text} onChange={(e) => updateFrame(i, { ...f, text: e.target.value })} />
                )}
                {f.t === "pause" && (
                  <input type="number" className={inputCls} value={f.ms} min={0} max={5000} onChange={(e) => updateFrame(i, { ...f, ms: Number(e.target.value) })} />
                )}
                {f.t === "table" && (
                  <div className="space-y-2">
                    <input className={inputCls} value={f.title} onChange={(e) => updateFrame(i, { ...f, title: e.target.value })} placeholder="caption (optional)" />
                    <div className="flex gap-2">
                      <input className={inputCls} value={f.headers[0]} onChange={(e) => updateFrame(i, { ...f, headers: [e.target.value, f.headers[1]] })} placeholder="header 1" />
                      <input className={inputCls} value={f.headers[1]} onChange={(e) => updateFrame(i, { ...f, headers: [f.headers[0], e.target.value] })} placeholder="header 2" />
                    </div>
                    {f.rows.map(([a, b], ri) => (
                      <div key={ri} className="flex gap-2">
                        <input className={inputCls} value={a} onChange={(e) => { const rows = f.rows.map((r, j) => (j === ri ? [e.target.value, r[1]] as [string, string] : r)); updateFrame(i, { ...f, rows }); }} />
                        <input className={inputCls} value={b} onChange={(e) => { const rows = f.rows.map((r, j) => (j === ri ? [r[0], e.target.value] as [string, string] : r)); updateFrame(i, { ...f, rows }); }} />
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => updateFrame(i, { ...f, rows: [...f.rows, ["Label", "0"]] })}>+ row</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
