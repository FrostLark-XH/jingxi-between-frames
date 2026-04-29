// ── AI service layer — unified entry point ────────────────────────────────
// Components import { getAiProvider } from "@/services/ai" and call
// provider.processFrame({ content }) — no knowledge of mock vs real AI.
//
// To swap in a real provider later, change the import here and update the
// factory return. No component changes needed.

import { AiProvider } from "./types";
import { mockAiProvider } from "./mockProvider";

export type { AiProvider, AiProviderType, FrameInput, FrameAiOutput } from "./types";

export function getAiProvider(): AiProvider {
  // When ready for real AI, swap the return:
  //   return openAiProvider;
  //   return customProvider;
  return mockAiProvider;
}
