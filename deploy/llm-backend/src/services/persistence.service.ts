import { Firestore } from '@google-cloud/firestore';
import { ConfigService } from './config.service';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelUsed?: string;
  provider?: string;
  fileReferences?: string[];
  metadata?: Record<string, any>;
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

export interface UploadRecord {
  id: string;
  userId: string;
  sessionId?: string;
  originalName: string;
  fileName: string;
  bucket: string;
  path: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export class PersistenceService {
  private firestore: Firestore;
  private config: ConfigService;

  constructor() {
    this.config = ConfigService.getInstance();
    this.firestore = new Firestore({
      projectId: this.config.getConfig().googleCloudProject,
      databaseId: this.config.getConfig().firestoreDatabase
    });
  }

  /**
   * Save a chat message
   */
  public async saveMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    try {
      const messageId = uuidv4();
      const timestamp = new Date();
      
      const chatMessage: ChatMessage = {
        id: messageId,
        timestamp,
        ...message
      };

      // Save message to Firestore
      await this.firestore
        .collection('sessions')
        .doc(message.sessionId)
        .collection('messages')
        .doc(messageId)
        .set(chatMessage);

      // Update session metadata
      await this.updateSessionMetadata(message.sessionId, message.userId, message.content);

      return chatMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error(`Failed to save message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get messages for a session
   */
  public async getSessionMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const snapshot = await this.firestore
        .collection('sessions')
        .doc(sessionId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sessionId: data.sessionId,
          userId: data.userId,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          modelUsed: data.modelUsed,
          provider: data.provider,
          fileReferences: data.fileReferences || [],
          metadata: data.metadata || {}
        } as ChatMessage;
      });
    } catch (error) {
      console.error(`Error getting messages for session ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Get user's chat sessions
   */
  public async getUserSessions(userId: string, limit: number = 20): Promise<ChatSession[]> {
    try {
      const snapshot = await this.firestore
        .collection('sessions')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          messageCount: data.messageCount || 0,
          lastMessage: data.lastMessage,
          metadata: data.metadata || {}
        } as ChatSession;
      });
    } catch (error) {
      console.error(`Error getting sessions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Create a new chat session
   */
  public async createSession(userId: string, title?: string): Promise<ChatSession> {
    try {
      const sessionId = uuidv4();
      const now = new Date();
      
      const session: ChatSession = {
        id: sessionId,
        userId,
        title: title || `Chat ${now.toLocaleDateString()}`,
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        metadata: {}
      };

      await this.firestore
        .collection('sessions')
        .doc(sessionId)
        .set(session);

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update session metadata
   */
  private async updateSessionMetadata(sessionId: string, userId: string, lastMessage: string): Promise<void> {
    try {
      const sessionRef = this.firestore.collection('sessions').doc(sessionId);
      
      // Get current session data
      const sessionDoc = await sessionRef.get();
      const currentData = sessionDoc.data();
      
      // Update message count and last message
      const messageCount = (currentData?.messageCount || 0) + 1;
      const updatedAt = new Date();
      
      await sessionRef.update({
        messageCount,
        lastMessage: lastMessage.substring(0, 200), // Truncate for storage
        updatedAt
      });
    } catch (error) {
      console.error(`Error updating session metadata for ${sessionId}:`, error);
    }
  }

  /**
   * Save upload record
   */
  public async saveUploadRecord(upload: Omit<UploadRecord, 'id' | 'uploadedAt'>): Promise<UploadRecord> {
    try {
      const uploadId = uuidv4();
      const uploadedAt = new Date();
      
      const uploadRecord: UploadRecord = {
        id: uploadId,
        uploadedAt,
        ...upload
      };

      await this.firestore
        .collection('uploads')
        .doc(uploadId)
        .set(uploadRecord);

      return uploadRecord;
    } catch (error) {
      console.error('Error saving upload record:', error);
      throw new Error(`Failed to save upload record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's upload records
   */
  public async getUserUploads(userId: string, limit: number = 50): Promise<UploadRecord[]> {
    try {
      const snapshot = await this.firestore
        .collection('uploads')
        .where('userId', '==', userId)
        .orderBy('uploadedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          sessionId: data.sessionId,
          originalName: data.originalName,
          fileName: data.fileName,
          bucket: data.bucket,
          path: data.path,
          size: data.size,
          contentType: data.contentType,
          uploadedAt: data.uploadedAt.toDate(),
          metadata: data.metadata || {}
        } as UploadRecord;
      });
    } catch (error) {
      console.error(`Error getting uploads for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get upload records for a session
   */
  public async getSessionUploads(sessionId: string): Promise<UploadRecord[]> {
    try {
      const snapshot = await this.firestore
        .collection('uploads')
        .where('sessionId', '==', sessionId)
        .orderBy('uploadedAt', 'asc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          sessionId: data.sessionId,
          originalName: data.originalName,
          fileName: data.fileName,
          bucket: data.bucket,
          path: data.path,
          size: data.size,
          contentType: data.contentType,
          uploadedAt: data.uploadedAt.toDate(),
          metadata: data.metadata || {}
        } as UploadRecord;
      });
    } catch (error) {
      console.error(`Error getting uploads for session ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Delete a session and all its messages
   */
  public async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Verify user owns the session
      const sessionDoc = await this.firestore.collection('sessions').doc(sessionId).get();
      const sessionData = sessionDoc.data();
      
      if (!sessionData || sessionData.userId !== userId) {
        throw new Error('Session not found or access denied');
      }

      // Delete all messages in the session
      const messagesSnapshot = await this.firestore
        .collection('sessions')
        .doc(sessionId)
        .collection('messages')
        .get();

      const batch = this.firestore.batch();
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the session document
      batch.delete(this.firestore.collection('sessions').doc(sessionId));
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete an upload record
   */
  public async deleteUploadRecord(uploadId: string, userId: string): Promise<boolean> {
    try {
      // Verify user owns the upload
      const uploadDoc = await this.firestore.collection('uploads').doc(uploadId).get();
      const uploadData = uploadDoc.data();
      
      if (!uploadData || uploadData.userId !== userId) {
        throw new Error('Upload not found or access denied');
      }

      await this.firestore.collection('uploads').doc(uploadId).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting upload ${uploadId}:`, error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalUploads: number;
    totalUploadSize: number;
  }> {
    try {
      // Get session count
      const sessionsSnapshot = await this.firestore
        .collection('sessions')
        .where('userId', '==', userId)
        .get();

      // Get uploads
      const uploadsSnapshot = await this.firestore
        .collection('uploads')
        .where('userId', '==', userId)
        .get();

      const totalSessions = sessionsSnapshot.size;
      const totalUploads = uploadsSnapshot.size;
      
      // Calculate total messages and upload size
      let totalMessages = 0;
      let totalUploadSize = 0;

      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalMessages += data.messageCount || 0;
      });

      uploadsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalUploadSize += data.size || 0;
      });

      return {
        totalSessions,
        totalMessages,
        totalUploads,
        totalUploadSize
      };
    } catch (error) {
      console.error(`Error getting stats for user ${userId}:`, error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalUploads: 0,
        totalUploadSize: 0
      };
    }
  }

  /**
   * Health check for Firestore
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test by reading a document
      const testDoc = await this.firestore.collection('_health').doc('test').get();
      return true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
      return false;
    }
  }
}
