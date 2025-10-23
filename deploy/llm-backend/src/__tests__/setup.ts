// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Google Cloud services for testing
jest.mock('@google-cloud/firestore');
jest.mock('@google-cloud/pubsub');
jest.mock('@google-cloud/secret-manager');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GOOGLE_AI_API_KEY = 'test-google-key';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.FLASK_BACKEND_URL = 'http://localhost:8080/api';
process.env.FLASK_BACKEND_SECRET = 'test-secret';
