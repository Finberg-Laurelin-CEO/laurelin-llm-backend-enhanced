import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from './config.service';
import { LLMRequest, LLMResponse, ModelProvider } from '../types';

export class LLMService {
  private openai!: OpenAI;
  private googleAI!: GoogleGenerativeAI;
  private bedrockClient!: BedrockRuntimeClient;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.config.getConfig().openaiApiKey
    });

    // Initialize Google AI
    this.googleAI = new GoogleGenerativeAI(this.config.getConfig().googleAiApiKey);

    // Initialize AWS Bedrock
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.config.getConfig().awsRegion,
      credentials: {
        accessKeyId: this.config.getConfig().awsAccessKeyId,
        secretAccessKey: this.config.getConfig().awsSecretAccessKey
      }
    });
  }

  public getAvailableProviders(): ModelProvider[] {
    return [
      {
        name: 'openai',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        capabilities: {
          streaming: true,
          function_calling: true,
          vision: true,
          max_tokens: 128000
        }
      },
      {
        name: 'google',
        models: ['gemini-pro', 'gemini-pro-vision'],
        capabilities: {
          streaming: true,
          function_calling: true,
          vision: true,
          max_tokens: 1000000
        }
      },
      {
        name: 'aws-bedrock',
        models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
        capabilities: {
          streaming: true,
          function_calling: true,
          vision: true,
          max_tokens: 200000
        }
      }
    ];
  }

  public async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const provider = request.model_provider || this.config.getConfig().abTestDefaultProvider;
    
    try {
      switch (provider) {
        case 'openai':
          return await this.generateOpenAIResponse(request);
        case 'google':
          return await this.generateGoogleResponse(request);
        case 'aws-bedrock':
          return await this.generateBedrockResponse(request);
        default:
          throw new Error(`Unsupported model provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating response with ${provider}:`, error);
      return {
        success: false,
        model_used: request.model_name || 'unknown',
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateOpenAIResponse(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model_name || 'gpt-3.5-turbo';
    
    const response = await this.openai.chat.completions.create({
      model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 1000,
      stream: false // Disable streaming for now to fix type issues
    });

    return {
      success: true,
      content: response.choices[0]?.message?.content || '',
      model_used: model,
      provider: 'openai',
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      metadata: {
        finish_reason: response.choices[0]?.finish_reason,
        model: response.model
      }
    };
  }

  private async generateGoogleResponse(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model_name || 'gemini-pro';
    const genModel = this.googleAI.getGenerativeModel({ model });

    // Convert messages to Google AI format
    const prompt = this.convertMessagesToPrompt(request.messages);

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      content: text,
      model_used: model,
      provider: 'google',
      metadata: {
        finish_reason: 'stop',
        model: model
      }
    };
  }

  private async generateBedrockResponse(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model_name || 'claude-3-sonnet-20240229';
    
    // Convert messages to Bedrock format
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.max_tokens || 1000,
      temperature: request.temperature || 0.7,
      messages
    };

    const command = new InvokeModelCommand({
      modelId: model,
      body: JSON.stringify(payload),
      contentType: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      success: true,
      content: responseBody.content[0]?.text || '',
      model_used: model,
      provider: 'aws-bedrock',
      usage: {
        prompt_tokens: responseBody.usage?.input_tokens || 0,
        completion_tokens: responseBody.usage?.output_tokens || 0,
        total_tokens: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
      },
      metadata: {
        finish_reason: responseBody.stop_reason,
        model: model
      }
    };
  }

  private convertMessagesToPrompt(messages: any[]): string {
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`;
          case 'user':
            return `User: ${msg.content}`;
          case 'assistant':
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n');
  }

  public async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Test OpenAI
    try {
      await this.openai.models.list();
      results.openai = true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      results.openai = false;
    }

    // Test Google AI
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('Hello');
      results.google = true;
    } catch (error) {
      console.error('Google AI health check failed:', error);
      results.google = false;
    }

    // Test AWS Bedrock
    try {
      const command = new InvokeModelCommand({
        modelId: 'claude-3-haiku-20240307',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        }),
        contentType: 'application/json'
      });
      await this.bedrockClient.send(command);
      results['aws-bedrock'] = true;
    } catch (error) {
      console.error('AWS Bedrock health check failed:', error);
      results['aws-bedrock'] = false;
    }

    return results;
  }
}
