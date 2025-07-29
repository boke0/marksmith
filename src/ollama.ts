import { createOllama } from "ollama-ai-provider";
import { Env } from './env.js';

export const ollama = createOllama({
  baseURL: Env.ollamaBaseUrl,
})
