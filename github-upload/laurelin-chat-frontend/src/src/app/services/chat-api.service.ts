import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ModelProvider {
  name: string;
  models: string[];
  capabilities: {
    streaming: boolean;
    function_calling: boolean;
    vision: boolean;
    max_tokens: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  modelUsed?: string;
  provider?: string;
  fileReferences?: string[];
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  model_used?: string;
  provider?: string;
  session_id?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
  metadata?: Record<string, any>;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  bucket: string;
  path: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  userId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface DataSource {
  bucket: string;
  prefix?: string;
  description: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private currentSessionId: string | null = null;
  private sessionSubject = new BehaviorSubject<string | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.generateNewSession();
  }

  private getAuthHeaders(): HttpHeaders {
    const headers = new HttpHeaders();
    const authHeaders = this.authService.getAuthHeaders();
    
    Object.keys(authHeaders).forEach(key => {
      headers.set(key, authHeaders[key]);
    });
    
    return headers;
  }

  private generateNewSession(): void {
    this.currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.sessionSubject.next(this.currentSessionId);
  }

  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public createNewSession(): void {
    this.generateNewSession();
  }

  public async sendMessage(
    message: string,
    modelProvider: string = 'google',
    modelName?: string,
    fileReferences: string[] = []
  ): Promise<ChatResponse> {
    try {
      const response = await this.http.post<ChatResponse>(
        `${environment.apiBaseUrl}/llm-chat-api`,
        {
          message,
          modelProvider,
          modelName,
          sessionId: this.currentSessionId,
          fileReferences
        },
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response || { success: false, error: 'No response received' };
    } catch (error: any) {
      console.error('Chat API error:', error);
      return {
        success: false,
        error: error.error?.error || error.message || 'Failed to send message'
      };
    }
  }

  public async getAvailableModels(): Promise<ModelProvider[]> {
    try {
      const response = await this.http.get<{ success: boolean; providers: ModelProvider[] }>(
        `${environment.apiBaseUrl}/llm-models-api`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response?.providers || [];
    } catch (error) {
      console.error('Models API error:', error);
      return [];
    }
  }

  public async uploadFile(file: File, sessionId?: string): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await this.http.post<{ success: boolean; file?: UploadedFile; error?: string }>(
        `${environment.apiBaseUrl}/llm-upload-api`,
        formData,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response || { success: false, error: 'No response received' };
    } catch (error: any) {
      console.error('Upload API error:', error);
      return {
        success: false,
        error: error.error?.error || error.message || 'Upload failed'
      };
    }
  }

  public async getChatHistory(sessionId?: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const params: any = { limit: limit.toString() };
      if (sessionId) {
        params.sessionId = sessionId;
      }

      const response = await this.http.get<{ success: boolean; messages: ChatMessage[] }>(
        `${environment.apiBaseUrl}/llm-history-api`,
        { 
          headers: this.getAuthHeaders(),
          params
        }
      ).toPromise();

      return response?.messages || [];
    } catch (error) {
      console.error('History API error:', error);
      return [];
    }
  }

  public async getUserSessions(limit: number = 20): Promise<ChatSession[]> {
    try {
      const response = await this.http.get<{ success: boolean; sessions: ChatSession[] }>(
        `${environment.apiBaseUrl}/llm-history-api`,
        { 
          headers: this.getAuthHeaders(),
          params: { limit: limit.toString() }
        }
      ).toPromise();

      return response?.sessions || [];
    } catch (error) {
      console.error('Sessions API error:', error);
      return [];
    }
  }

  public async getDataSources(): Promise<DataSource[]> {
    try {
      const response = await this.http.get<{ success: boolean; dataSources: DataSource[] }>(
        `${environment.apiBaseUrl}/llm-data-sources-api`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response?.dataSources || [];
    } catch (error) {
      console.error('Data sources API error:', error);
      return [];
    }
  }

  public async pollForResponse(sessionId: string, maxAttempts: number = 30): Promise<ChatResponse> {
    let attempts = 0;
    
    return new Promise((resolve) => {
      const poll = async () => {
        attempts++;
        
        try {
          const response = await this.http.get<{
            success: boolean;
            status: string;
            response?: string;
            model_used?: string;
            provider?: string;
            error?: string;
          }>(
            `${environment.apiBaseUrl}/llm-response-api/${sessionId}`,
            { headers: this.getAuthHeaders() }
          ).toPromise();

          if (response?.success && response.status === 'completed') {
            resolve({
              success: true,
              content: response.response,
              model_used: response.model_used,
              provider: response.provider
            });
          } else if (attempts >= maxAttempts) {
            resolve({
              success: false,
              error: 'Response timeout - please try again'
            });
          } else {
            // Still processing, poll again in 2 seconds
            setTimeout(poll, 2000);
          }
        } catch (error: any) {
          resolve({
            success: false,
            error: error.error?.error || error.message || 'Failed to get response'
          });
        }
      };
      
      // Start polling after 2 seconds
      setTimeout(poll, 2000);
    });
  }

  public async healthCheck(): Promise<{ status: string; checks: Record<string, boolean> }> {
    try {
      const response = await this.http.get<{
        status: string;
        checks: Record<string, boolean>;
        timestamp: string;
      }>(
        `${environment.apiBaseUrl}/llm-health-check`
      ).toPromise();

      return {
        status: response?.status || 'unknown',
        checks: response?.checks || {}
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        checks: {}
      };
    }
  }
}
