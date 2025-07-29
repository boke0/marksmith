export const Env = {
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
  ollamaLLM: process.env.OLLAMA_LLM || 'qwen3:4b',
  ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large',
}
