export const Env = {
  port: process.env.PORT || 13000,
  chromaPort: process.env.CHROMA_PORT || 13001,
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api',
  ollamaLLM: process.env.OLLAMA_LLM || 'gemma3:4b',
  ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large',
}
