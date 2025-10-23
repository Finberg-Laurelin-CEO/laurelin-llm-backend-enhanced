"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseAPI = exports.loginAPI = exports.chatAPI = exports.healthCheck = exports.onConvoInput = void 0;
const processing_service_1 = require("./src/services/processing.service");
const auth_service_1 = require("./src/services/auth.service");
const validation_1 = require("./src/utils/validation");
const cors = __importStar(require("cors"));
const helmet = __importStar(require("helmet"));
const processingService = new processing_service_1.ProcessingService();
const authService = new auth_service_1.AuthService();
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        if (origin.includes('laurelin.com') || origin.includes('laurelin.inc')) {
            return callback(null, true);
        }
        if (origin.includes('googleusercontent.com') || origin.includes('appspot.com')) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
const corsMiddleware = cors(corsOptions);
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authorization header required' });
            return;
        }
        const token = authHeader.substring(7);
        if (token.startsWith('eyJ')) {
            const authResult = await authService.verifyGoogleToken(token);
            if (!authResult.success) {
                res.status(401).json({ error: authResult.error });
                return;
            }
            req.user = authResult.user;
        }
        else {
            const authResult = authService.validateSessionToken(token);
            if (!authResult.success) {
                res.status(401).json({ error: authResult.error });
                return;
            }
            req.user = authResult.user;
        }
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
const onConvoInput = async (cloudEvent) => {
    try {
        console.log('Received LLM processing request:', cloudEvent.id);
        const messageData = cloudEvent.data?.message?.data;
        if (!messageData) {
            throw new Error('No message data found in CloudEvent');
        }
        const decodedData = Buffer.from(messageData, 'base64').toString();
        const rawRequest = JSON.parse(decodedData);
        const llmRequest = (0, validation_1.validateLLMRequest)(rawRequest);
        console.log('Processing LLM request for session:', llmRequest.session_id);
        const response = await processingService.processLLMRequest(llmRequest);
        console.log('LLM processing completed:', {
            session_id: llmRequest.session_id,
            success: response.success,
            model_used: response.model_used,
            provider: response.provider
        });
        return response;
    }
    catch (error) {
        console.error('Error processing LLM request:', error);
        if (error instanceof validation_1.ValidationError) {
            return {
                success: false,
                model_used: 'unknown',
                provider: 'unknown',
                error: error.message
            };
        }
        throw error;
    }
};
exports.onConvoInput = onConvoInput;
const healthCheck = async (req, res) => {
    try {
        const health = await processingService.healthCheck();
        const isHealthy = Object.values(health).every(status => status === true);
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            service: 'laurelin-llm-backend',
            version: '1.0.0',
            checks: health,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'laurelin-llm-backend',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
};
exports.healthCheck = healthCheck;
const chatAPI = async (req, res) => {
    corsMiddleware(req, res, () => { });
    helmet()(req, res, () => { });
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    authenticateUser(req, res, async () => {
        try {
            const user = req.user;
            console.log('Received chat API request from user:', user.email);
            const llmRequest = (0, validation_1.validateLLMRequest)(req.body);
            llmRequest.user_id = user.id;
            console.log('Processing chat request for session:', llmRequest.session_id, 'user:', user.email);
            const response = await processingService.processLLMRequest(llmRequest);
            console.log('Chat request processed:', {
                session_id: llmRequest.session_id,
                user_email: user.email,
                success: response.success,
                model_used: response.model_used,
                provider: response.provider
            });
            res.status(200).json({
                success: true,
                session_id: llmRequest.session_id,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                response: response
            });
        }
        catch (error) {
            console.error('Error processing chat request:', error);
            if (error instanceof validation_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
};
exports.chatAPI = chatAPI;
const loginAPI = async (req, res) => {
    corsMiddleware(req, res, () => { });
    helmet()(req, res, () => { });
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ error: 'ID token is required' });
            return;
        }
        const authResult = await authService.verifyGoogleToken(idToken);
        if (!authResult.success) {
            res.status(401).json({ error: authResult.error });
            return;
        }
        const user = authResult.user;
        const sessionToken = authService.generateSessionToken(user);
        console.log('User logged in successfully:', user.email);
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                domain: user.domain
            },
            sessionToken: sessionToken
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
exports.loginAPI = loginAPI;
const responseAPI = async (req, res) => {
    corsMiddleware(req, res, () => { });
    helmet()(req, res, () => { });
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    authenticateUser(req, res, async () => {
        try {
            const sessionId = req.params.sessionId;
            if (!sessionId) {
                res.status(400).json({ error: 'Session ID is required' });
                return;
            }
            res.status(200).json({
                success: true,
                session_id: sessionId,
                status: 'completed',
                response: 'This is a placeholder response. The actual response would be retrieved from storage.'
            });
        }
        catch (error) {
            console.error('Error retrieving response:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    });
};exports.responseAPI = responseAPI;
//# sourceMappingURL=index.js.map
