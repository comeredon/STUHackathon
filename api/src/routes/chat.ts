import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getMcpClient } from '../services/mcpClient';

const router = Router();

interface ChatRequest {
  message: string;
  threadId?: string;
}

interface ChatResponse {
  success: boolean;
  data?: {
    content: string;
    threadId?: string;
    runId?: string;
  };
  message: string;
  error?: string;
}

/**
 * POST /api/chat
 * Send a message to Fabric Data Agent via MCP
 * No authentication required
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { message }: ChatRequest = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  try {
    console.log(`Chat request: "${message}"`);
    
    // Get the MCP client (uses singleton pattern)
    const mcpClient = await getMcpClient();

    // Send message to Fabric Data Agent via MCP
    const response = await mcpClient.sendMessage(message);

    const chatResponse: ChatResponse = {
      success: true,
      data: {
        content: response
      },
      message: 'Response received from Fabric Data Agent'
    };

    res.json(chatResponse);
  } catch (error: any) {
    console.error('MCP Chat error:', error);
    
    const chatResponse: ChatResponse = {
      success: false,
      message: 'Failed to process chat request via MCP',
      error: error.message || 'Unknown error occurred'
    };

    res.status(500).json(chatResponse);
  }
}));

/**
 * POST /api/chat/demo
 * Alias for main endpoint (for backwards compatibility)
 */
router.post('/demo', asyncHandler(async (req: Request, res: Response) => {
  const { message }: ChatRequest = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  try {
    console.log(`Demo chat request: "${message}"`);
    
    // Get the MCP client (uses singleton pattern)
    const mcpClient = await getMcpClient();

    // Send message to Fabric Data Agent via MCP
    const response = await mcpClient.sendMessage(message);

    const chatResponse: ChatResponse = {
      success: true,
      data: {
        content: response
      },
      message: 'Response received from Fabric Data Agent'
    };

    res.json(chatResponse);
  } catch (error: any) {
    console.error('MCP Chat error:', error);
    
    const chatResponse: ChatResponse = {
      success: false,
      message: 'Failed to process chat request via MCP',
      error: error.message || 'Unknown error occurred'
    };

    res.status(500).json(chatResponse);
  }
}));

export default router;
