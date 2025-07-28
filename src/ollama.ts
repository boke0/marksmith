import { createOllama } from "ollama-ai-provider";
import { Config } from './config';

export const ollama = createOllama({
  baseURL: Config.ollamaBaseUrl,
})
