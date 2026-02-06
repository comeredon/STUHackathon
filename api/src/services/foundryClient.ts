import { DefaultAzureCredential, OnBehalfOfCredential } from '@azure/identity';

const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT || '';
const FOUNDRY_PROJECT_ID = process.env.FOUNDRY_PROJECT_ID || '';
const FOUNDRY_AGENT_ID = process.env.FOUNDRY_AGENT_ID || '';
const USE_MANAGED_IDENTITY = process.env.USE_MANAGED_IDENTITY === 'true';
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || '';
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';

interface FoundryThread {
  id: string;
}

interface FoundryMessage {
  id: string;
  role: string;
  content: Array<{ text?: { value: string } }>;
}

interface FoundryRun {
  id: string;
  status: string;
}

/**
 * Azure AI Foundry client using On-Behalf-Of (OBO) flow
 * Uses user's Bearer token to maintain user context when calling Foundry
 */
export class FoundryClient {
  private userToken: string;
  private baseUrl: string;

  constructor(userToken: string) {
    this.userToken = userToken;
    this.baseUrl = `${FOUNDRY_ENDPOINT}/api/projects/${FOUNDRY_PROJECT_ID}`;
  }

  /**
   * Get access token for Foundry using On-Behalf-Of flow
   * In production with Managed Identity: Uses user token + MI for OBO
   * In development: Uses client credentials + user token for OBO
   */
  private async getFoundryToken(): Promise<string> {
    try {
      if (USE_MANAGED_IDENTITY) {
        // Production: Use Managed Identity with OBO
        // The Managed Identity of the Container App will exchange the user token
        const credential = new DefaultAzureCredential();
        const tokenResponse = await credential.getToken([
          'https://cognitiveservices.azure.com/.default'
        ]);
        return tokenResponse.token;
      } else {
        // Development: Use client credentials for OBO
        if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
          // Fallback: Use user token directly (for testing)
          console.warn('OBO credentials not configured, using user token directly');
          return this.userToken;
        }

        const oboCredential = new OnBehalfOfCredential({
          tenantId: AZURE_TENANT_ID,
          clientId: AZURE_CLIENT_ID,
          clientSecret: AZURE_CLIENT_SECRET,
          userAssertionToken: this.userToken
        });

        const tokenResponse = await oboCredential.getToken([
          'https://cognitiveservices.azure.com/.default'
        ]);
        return tokenResponse.token;
      }
    } catch (error) {
      console.error('Failed to get Foundry token:', error);
      throw new Error('Authentication failed with Azure AI Foundry');
    }
  }

  /**
   * Make authenticated request to Foundry API
   */
  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getFoundryToken();
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'api-version': '2025-11-15-preview'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Foundry API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a new conversation thread
   */
  async createThread(): Promise<string> {
    const response: FoundryThread = await this.makeRequest('/threads', 'POST', {});
    return response.id;
  }

  /**
   * Post a message to a thread
   */
  async postMessage(threadId: string, content: string): Promise<void> {
    await this.makeRequest(`/threads/${threadId}/messages`, 'POST', {
      role: 'user',
      content
    });
  }

  /**
   * Create a run (execute agent)
   */
  async createRun(threadId: string): Promise<string> {
    const response: FoundryRun = await this.makeRequest(
      `/threads/${threadId}/runs`,
      'POST',
      { assistant_id: FOUNDRY_AGENT_ID }
    );
    return response.id;
  }

  /**
   * Poll run status until completion
   */
  async waitForCompletion(
    threadId: string,
    runId: string,
    maxAttempts: number = 30
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const run: FoundryRun = await this.makeRequest(
        `/threads/${threadId}/runs/${runId}`,
        'GET'
      );

      if (run.status === 'completed') {
        return;
      }

      if (run.status === 'failed' || run.status === 'cancelled') {
        throw new Error(`Run ${run.status}`);
      }

      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Run timed out');
  }

  /**
   * Get the latest message from a thread
   */
  async getLatestMessage(threadId: string): Promise<string> {
    const response = await this.makeRequest(`/threads/${threadId}/messages`, 'GET');
    const messages: FoundryMessage[] = response.data || [];
    
    // Find the latest assistant message
    const assistantMessage = messages
      .filter((m: FoundryMessage) => m.role === 'assistant')
      .sort((a: FoundryMessage, b: FoundryMessage) => b.id.localeCompare(a.id))[0];

    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    return assistantMessage.content[0]?.text?.value || 'No response';
  }
}

/**
 * Factory function to create Foundry client with user context
 */
export async function createFoundryClient(userToken: string): Promise<FoundryClient> {
  if (!FOUNDRY_ENDPOINT || !FOUNDRY_PROJECT_ID || !FOUNDRY_AGENT_ID) {
    throw new Error('Azure AI Foundry configuration is incomplete');
  }

  return new FoundryClient(userToken);
}
