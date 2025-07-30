import { MCPServer } from '@mastra/mcp';

import { documentQueryTool } from './tools/documentQueryTool.js';
import { indexingTool } from './tools/indexingTool.js';
import { askRagAgentTool } from './tools/askRagAgentTool.js';

export const server = new MCPServer({
  name: 'Repocks',
  version: '1.0.0',
  tools: {
    documentQueryTool,
    indexingTool,
    askRagAgentTool,
  },
});
