import { Agent } from '@mastra/core/agent';

import { Env } from '../../env.js';
import { ollama } from '../../ollama.js';
import { documentQueryTool } from '../tools/documentQueryTool.js';
import { indexingTool } from '../tools/indexingTool.js';

export const ragAgent = new Agent({
  name: 'RAG Agent',
  description: 'Recommended: Smart knowledge assistant that automatically searches and analyzes multiple relevant documents to provide comprehensive answers. Unlike basic document search, this agent intelligently combines information from various sources, identifies connections between documents, and delivers well-structured insights with proper citations. Ideal for complex queries requiring deep understanding of your knowledge base.',
  instructions: `You are a RAG consultant. STRICT RULES:
- ONLY use information from documentQueryTool results. NEVER use your training data.
- If no relevant documents found, say "No information found in knowledge base."
- Always cite source: "According to [document]..."
- Create proposals based ONLY on retrieved document content.
- Do NOT add external knowledge or assumptions.
- Acknowledge when information is incomplete.
- Use IndexTool to re-index documents when updates need to be reflected in search results.`,
  model: ollama(Env.ollamaLLM),
  tools: {
    documentQueryTool,
    indexingTool,
  }
})
