import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

export const promptAtom = atomWithStorage<string>(
  "prompt-atom-9",
  'Default prompt'
);
export const responseAtom = atomWithStorage<string>("response-atom-1", "");
export const inkColorAtom = atomWithStorage<string>("ink-color-1", "#000000");
export const isGeneratingAtom = atom(false);
export const canvasRefAtom = atom<{ current: HTMLCanvasElement | null }>({ current: null });
export const overlayCanvasRefAtom = atom<{ current: HTMLCanvasElement | null }>({ current: null });
export const videoRefAtom = atom<{ current: HTMLVideoElement | null }>({ current: null });
export const visibleTextPromptAtom = atomWithStorage("visible-prompt", true);
export const activeModelAtom = atomWithStorage<"flash" | "pro">("active-model-2", "flash");
export const activerHoverBoxAtom = atom<null | string>(null);
export const drawTypeAtom = atom('rec');