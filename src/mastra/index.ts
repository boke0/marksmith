import { MCPServer } from '@mastra/mcp';

import { ragTool } from './tools/ragTool';

export const server = new MCPServer({
  name: 'MarkSmith',
  version: '1.0.0',
  tools: {
    ragTool,
  },
});
