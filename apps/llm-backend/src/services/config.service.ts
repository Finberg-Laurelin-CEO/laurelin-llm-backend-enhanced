import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  // Google Cloud
  googleCloudProject: string;
  googleApplicationCredentials?: string;
  
  // Model API Keys
  openaiApiKey: string;
  googleAiApiKey: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  
  // Flask Backend Integration
  flaskBackendUrl: string;
  flaskBackendSecret: string;
  
  // Pub/Sub
  pubsubTopicName: string;
  pubsubSubscriptionName: string;
  
  // Firestore
  firestoreDatabase: string;
  
  // Function Configuration
  functionRegion: string;
  functionMemory: string;
  functionTimeout: string;
  
  // A/B Testing
  abTestEnabled: boolean;
  abTestDefaultProvider: string;
  
  // Environment
  environment: 'development' | 'production' | 'testing';
}

export class ConfigService {
  private static instance: ConfigService;
  private config: Config;

  private constructor() {
    this.config = {
      googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || '',
      googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      
      flaskBackendUrl: process.env.FLASK_BACKEND_URL || 'http://localhost:8080/api',
      flaskBackendSecret: process.env.FLASK_BACKEND_SECRET || '',
      
      pubsubTopicName: process.env.PUBSUB_TOPIC_NAME || 'llm-processing',
      pubsubSubscriptionName: process.env.PUBSUB_SUBSCRIPTION_NAME || 'llm-processing-sub',
      
      firestoreDatabase: process.env.FIRESTORE_DATABASE || '(default)',
      
      functionRegion: process.env.FUNCTION_REGION || 'us-central1',
      functionMemory: process.env.FUNCTION_MEMORY || '1GB',
      functionTimeout: process.env.FUNCTION_TIMEOUT || '300s',
      
      abTestEnabled: process.env.AB_TEST_ENABLED === 'true',
      abTestDefaultProvider: process.env.AB_TEST_DEFAULT_PROVIDER || 'openai',
      
      environment: (process.env.NODE_ENV as any) || 'development'
    };
    
    this.validateConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getConfig(): Config {
    return this.config;
  }

  private validateConfig(): void {
    const required = [
      'googleCloudProject',
      'openaiApiKey',
      'googleAiApiKey',
      'flaskBackendUrl'
    ];

    const missing = required.filter(key => !this.config[key as keyof Config]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
}
