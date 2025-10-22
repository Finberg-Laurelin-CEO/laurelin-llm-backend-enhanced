import { Config, Environment } from '@laurelin/shared-types';

export const getConfig = (environment: Environment = 'development'): Config => {
  const baseConfig: Config = {
    environment,
    gcp: {
      project_id: 'sacred-attic-473120-i0',
      region: 'us-central1',
    },
    api: {
      openai: {
        api_key: process.env.OPENAI_API_KEY || '',
        model: 'gpt-3.5-turbo',
      },
      google: {
        api_key: process.env.GOOGLE_AI_API_KEY || '',
        model: 'gemini-pro',
      },
      aws: {
        access_key_id: process.env.AWS_ACCESS_KEY_ID || '',
        secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        model: 'claude-3-sonnet',
      },
    },
    services: {
      frontend_url: process.env.FRONTEND_URL || 'http://localhost:4200',
      backend_url: process.env.BACKEND_URL || 'http://localhost:8080',
      llm_backend_url: process.env.LLM_BACKEND_URL || 'https://us-central1-sacred-attic-473120-i0.cloudfunctions.net',
    },
  };

  // Environment-specific overrides
  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        services: {
          frontend_url: 'https://laurelin-chat.com',
          backend_url: 'https://api.laurelin-chat.com',
          llm_backend_url: 'https://us-central1-sacred-attic-473120-i0.cloudfunctions.net',
        },
      };
    case 'staging':
      return {
        ...baseConfig,
        services: {
          frontend_url: 'https://staging.laurelin-chat.com',
          backend_url: 'https://staging-api.laurelin-chat.com',
          llm_backend_url: 'https://us-central1-sacred-attic-473120-i0.cloudfunctions.net',
        },
      };
    default:
      return baseConfig;
  }
};

export const AB_TEST_VARIANTS = {
  openai: { weight: 0.5, config: { provider: 'openai', model: 'gpt-3.5-turbo' } },
  google: { weight: 0.5, config: { provider: 'google', model: 'gemini-pro' } },
};

export const DEPLOYMENT_CONFIG = {
  cloud_functions: {
    runtime: 'nodejs20',
    region: 'us-central1',
    memory: '1GB',
    timeout: '300s',
    max_instances: 10,
  },
  cloud_run: {
    runtime: 'python311',
    region: 'us-central1',
    min_instances: 1,
    max_instances: 10,
    port: 8080,
  },
  storage: {
    bucket_name: 'laurelin-frontend-assets',
    region: 'us-central1',
  },
};
