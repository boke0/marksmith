import { ChromaVector } from "@mastra/chroma";
import { Env } from "./env";

export const chroma = new ChromaVector({
  path: `http://localhost:${Env.chromaPort}`
})
