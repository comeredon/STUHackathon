import { Router, Request, Response } from 'express';
import { validateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { createFoundryClient } from '../services/foundryClient';

const router = Router();

interface ChatRequest {
  message: string;
  threadId?: string;
}

interface ChatResponse {
  success: boolean;
  data?: {
    content: string;
    threadId: string;
    runId?: string;
  };
  message: string;
  error?: string;
}

/**
 * POST /api/chat
 * Send a message to Azure AI Foundry agent using user's credentials
 */
router.post('/', validateToken, asyncHandler(async (req: Request, res: Response) => {
  const { message, threadId }: ChatRequest = req.body;
  const userToken = (req as any).userToken;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  try {
    // Create Foundry client with user's token (OBO flow)
    const foundryClient = await createFoundryClient(userToken);

    // Create or use existing thread
    const currentThreadId = threadId || await foundryClient.createThread();

    // Post message to thread
    await foundryClient.postMessage(currentThreadId, message);

    // Create run
    const runId = await foundryClient.createRun(currentThreadId);

    // Poll for completion
    const result = await foundryClient.waitForCompletion(currentThreadId, runId);

    // Get agent response
    const response = await foundryClient.getLatestMessage(currentThreadId);

    const chatResponse: ChatResponse = {
      success: true,
      data: {
        content: response,
        threadId: currentThreadId,
        runId
      },
      message: 'Response received successfully'
    };

    res.json(chatResponse);
  } catch (error: any) {
    console.error('Chat error:', error);
    
    const chatResponse: ChatResponse = {
      success: false,
      message: 'Failed to process chat request',
      error: error.message || 'Unknown error occurred'
    };

    res.status(500).json(chatResponse);
  }
}));

export default router;
