import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import { MAX_DECODED_CHARS, scriptSchema, settingsSchema } from "./schema";

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(frames: unknown, settings: unknown): string {
  const payload = JSON.stringify({
    v: 1,
    frames,
    settings,
  });
  return b64urlEncode(deflateSync(strToU8(payload), { level: 9 }));
}

export function decodeShare(data: string) {
  const raw = b64urlDecode(data);
  let json: string;
  try {
    json = strFromU8(inflateSync(raw));
  } catch {
    json = strFromU8(raw);
  }
  if (json.length > MAX_DECODED_CHARS * 2) throw new Error("payload too large");
  const parsed = JSON.parse(json);
  const frames = scriptSchema.parse(parsed.frames ?? parsed);
  const settings = settingsSchema
    .partial()
    .parse(parsed.settings ?? {});
  return { frames, settings };
}
