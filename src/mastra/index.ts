import { MCPServer } from '@mastra/mcp';

import { ragAgent } from './agents/ragAgent.js';
import { documentQueryTool } from './tools/documentQueryTool.js';
import { indexingTool } from './tools/indexingTool.js';

export const server = new MCPServer({
  name: 'Repocks',
  version: '1.0.0',
  agents: {
    ragAgent
  },
  tools: {
    documentQueryTool,
    indexingTool,
  },
});
