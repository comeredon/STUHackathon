import { DefaultAzureCredential, OnBehalfOfCredential } from '@azure/identity';

// Read env vars lazily via getters to ensure dotenv has loaded
const getFoundryEndpoint = () => process.env.FOUNDRY_ENDPOINT || '';
const getFoundryProjectId = () => process.env.FOUNDRY_PROJECT_ID || '';
const getFoundryAgentId = () => process.env.FOUNDRY_AGENT_ID || '';
const useManagedIdentity = () => process.env.USE_MANAGED_IDENTITY === 'true';
const getAzureTenantId = () => process.env.AZURE_TENANT_ID || '';
const getAzureClientId = () => process.env.AZURE_CLIENT_ID || '';
const getAzureClientSecret = () => process.env.AZURE_CLIENT_SECRET || '';

// Azure AI Foundry uses https://ai.azure.com as the token audience
const FOUNDRY_TOKEN_AUDIENCE = 'https://ai.azure.com';
const API_VERSION = '2025-05-01';

interface FoundryThread {
  id: string;
}

interface FoundryMessage {
  id: string;
  role: string;
  content: Array<{ text?: { value: string }; type?: string }>;
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
    this.baseUrl = `${getFoundryEndpoint()}/api/projects/${getFoundryProjectId()}`;
    console.log(`FoundryClient initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Get access token for Foundry using On-Behalf-Of flow
   * In production with Managed Identity: Uses user token + MI for OBO
   * In development: Uses client credentials + user token for OBO
   */
  private async getFoundryToken(): Promise<string> {
    try {
      if (useManagedIdentity()) {
        // Production: Use Managed Identity with OBO
        // The Managed Identity of the Container App will exchange the user token
        const credential = new DefaultAzureCredential();
        const tokenResponse = await credential.getToken([
          `${FOUNDRY_TOKEN_AUDIENCE}/.default`
        ]);
        return tokenResponse.token;
      } else {
        // Development: Use client credentials for OBO
        const tenantId = getAzureTenantId();
        const clientId = getAzureClientId();
        const clientSecret = getAzureClientSecret();
        
        if (!tenantId || !clientId || !clientSecret) {
          // Fallback: Use DefaultAzureCredential (works with az login)
          console.warn('OBO credentials not configured, using DefaultAzureCredential');
          const credential = new DefaultAzureCredential();
          const tokenResponse = await credential.getToken([
            `${FOUNDRY_TOKEN_AUDIENCE}/.default`
          ]);
          return tokenResponse.token;
        }

        const oboCredential = new OnBehalfOfCredential({
          tenantId,
          clientId,
          clientSecret,
          userAssertionToken: this.userToken
        });

        const tokenResponse = await oboCredential.getToken([
          `${FOUNDRY_TOKEN_AUDIENCE}/.default`
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
    // Add api-version as query parameter
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${separator}api-version=${API_VERSION}`;

    console.log(`Making ${method} request to: ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Foundry API error: ${response.status} - ${errorText}`);
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
      { assistant_id: getFoundryAgentId() }
    );
    return response.id;
  }

  /**
   * Poll run status until completion
   */
  async waitForCompletion(
    threadId: string,
    runId: string,
    maxAttempts: number = 180
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const run: FoundryRun = await this.makeRequest(
        `/threads/${threadId}/runs/${runId}`,
        'GET'
      );

      console.log(`Run status (attempt ${i + 1}/${maxAttempts}): ${run.status}`);

      if (run.status === 'completed') {
        return;
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}`);
      }

      // Wait 1 second before polling again (faster polling)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Run timed out after 3 minutes');
  }

  /**
   * Get the latest message from a thread
   * Handles both text responses and Code Interpreter outputs
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

    // Handle different content types (text, code interpreter, etc.)
    const contentParts: string[] = [];
    for (const content of assistantMessage.content) {
      if (content.type === 'text' && content.text?.value) {
        contentParts.push(content.text.value);
      } else if (content.text?.value) {
        // Fallback for simple text content
        contentParts.push(content.text.value);
      }
    }

    return contentParts.join('\n') || 'No response';
  }
}

/**
 * Factory function to create Foundry client with user context
 */
export async function createFoundryClient(userToken: string): Promise<FoundryClient> {
  const endpoint = getFoundryEndpoint();
  const projectId = getFoundryProjectId();
  const agentId = getFoundryAgentId();
  
  console.log(`Creating FoundryClient - endpoint: ${endpoint}, project: ${projectId}, agent: ${agentId}`);
  
  if (!endpoint || !projectId || !agentId) {
    throw new Error(`Azure AI Foundry configuration is incomplete. endpoint=${endpoint}, project=${projectId}, agent=${agentId}`);
  }

  return new FoundryClient(userToken);
}

/**
 * Factory function to create Foundry client using DefaultAzureCredential
 * Useful for demo/testing without user authentication
 */
export async function createFoundryClientWithDefaultCredential(): Promise<FoundryClient> {
  const endpoint = getFoundryEndpoint();
  const projectId = getFoundryProjectId();
  const agentId = getFoundryAgentId();
  
  console.log(`Creating FoundryClient (demo) - endpoint: ${endpoint}, project: ${projectId}, agent: ${agentId}`);
  
  if (!endpoint || !projectId || !agentId) {
    throw new Error(`Azure AI Foundry configuration is incomplete. endpoint=${endpoint}, project=${projectId}, agent=${agentId}`);
  }

  // Pass empty token - the client will use DefaultAzureCredential
  return new FoundryClient('');
}
