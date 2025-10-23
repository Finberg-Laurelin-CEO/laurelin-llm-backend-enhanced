import axios, { AxiosInstance } from 'axios';
import { ConfigService } from './config.service';
import { ChatSession, LLMResponse } from '../types';

export class FlaskIntegrationService {
  private httpClient: AxiosInstance;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.httpClient = axios.create({
      baseURL: this.config.getConfig().flaskBackendUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.getConfig().flaskBackendSecret}`
      }
    });
  }

  public async updateChatSession(sessionId: string, response: LLMResponse): Promise<boolean> {
    try {
      const updateData = {
        messages: [
          {
            role: 'assistant',
            content: response.content,
            model_used: response.model_used,
            metadata: response.metadata
          }
        ],
        updated_at: new Date().toISOString()
      };

      await this.httpClient.put(`/chat/sessions/${sessionId}`, updateData);
      return true;
    } catch (error) {
      console.error('Failed to update chat session:', error);
      return false;
    }
  }

  public async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const response = await this.httpClient.get(`/chat/sessions/${sessionId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  public async trackABTestEvent(
    userId: string,
    experimentName: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<boolean> {
    try {
      await this.httpClient.post(`/ab-testing/experiments/${experimentName}/track`, {
        event_type: eventType,
        event_data: {
          ...eventData,
          user_id: userId
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to track A/B test event:', error);
      return false;
    }
  }

  public async getUserABTestAssignment(
    userId: string,
    experimentName: string
  ): Promise<string | null> {
    try {
      const response = await this.httpClient.get(
        `/ab-testing/experiments/${experimentName}/assignment`
      );
      return response.data.variant || null;
    } catch (error) {
      console.error('Failed to get A/B test assignment:', error);
      return null;
    }
  }

  public async logProcessingEvent(eventData: Record<string, any>): Promise<boolean> {
    try {
      await this.httpClient.post('/logging/events', {
        service: 'llm-backend',
        event_type: 'processing',
        timestamp: new Date().toISOString(),
        data: eventData
      });
      return true;
    } catch (error) {
      console.error('Failed to log processing event:', error);
      return false;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Flask backend health check failed:', error);
      return false;
    }
  }
}
