import { z } from "zod";

export const cmdFrame = z.object({
  t: z.literal("cmd"),
  cmd: z.string().max(200),
  prompt: z.string().max(60).optional(),
});
export const outFrame = z.object({
  t: z.literal("out"),
  text: z.string().max(2000),
});
export const pauseFrame = z.object({
  t: z.literal("pause"),
  ms: z.number().int().min(0).max(5000),
});
export const tableFrame = z.object({
  t: z.literal("table"),
  title: z.string().max(60).default(""),
  headers: z.tuple([z.string().max(40), z.string().max(40)]).default(["Title", "Count"]),
  rows: z.array(z.tuple([z.string().max(40), z.string().max(40)])).max(20),
});

export const frameSchema = z.discriminatedUnion("t", [
  cmdFrame,
  outFrame,
  pauseFrame,
  tableFrame,
]);
export type Frame = z.infer<typeof frameSchema>;
export const scriptSchema = z.array(frameFrameSafe()).min(1).max(30);

function frameFrameSafe() {
  return frameSchema;
}

export const settingsSchema = z.object({
  theme: z.string().max(30).default("tokyonight"),
  typingSpeed: z.number().int().min(5).max(200).default(45),
  fontSize: z.number().int().min(10).max(22).default(14),
  chrome: z.enum(["mac", "linux", "none"]).default("mac"),
  cursor: z.boolean().default(true),
  loop: z.boolean().default(false),
  username: z.string().max(30).default("DrakeAxelrod"),
});

export type Settings = z.infer<typeof settingsSchema>;

export const MAX_DECODED_CHARS = 8000;
