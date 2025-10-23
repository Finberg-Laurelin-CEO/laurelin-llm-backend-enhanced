import { Storage } from '@google-cloud/storage';
import { ConfigService } from './config.service';
import { v4 as uuidv4 } from 'uuid';

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

export interface UploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

export class FileUploadService {
  private storage: Storage;
  private config: ConfigService;
  private uploadBucket: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    this.config = ConfigService.getInstance();
    this.storage = new Storage({
      projectId: this.config.getConfig().googleCloudProject
    });
    
    this.uploadBucket = process.env.USER_UPLOAD_BUCKET || 'laurelin-user-uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '1073741824'); // 1GB default
    this.allowedTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
  }

  /**
   * Upload a file to GCS
   */
  public async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    contentType: string,
    userId: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(fileBuffer, originalName, contentType);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate unique file name
      const fileId = uuidv4();
      const fileExtension = this.getFileExtension(originalName);
      const fileName = `${fileId}${fileExtension}`;
      const path = `uploads/${userId}/${fileName}`;

      // Upload to GCS
      const bucket = this.storage.bucket(this.uploadBucket);
      const file = bucket.file(path);

      const uploadOptions = {
        metadata: {
          contentType,
          metadata: {
            originalName,
            userId,
            sessionId: sessionId || '',
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
        }
      };

      await file.save(fileBuffer, uploadOptions);

      // Make file publicly readable (optional - could be private with signed URLs)
      await file.makePublic();

      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName,
        fileName,
        bucket: this.uploadBucket,
        path,
        size: fileBuffer.length,
        contentType,
        uploadedAt: new Date(),
        userId,
        sessionId,
        metadata
      };

      return {
        success: true,
        file: uploadedFile
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get file content
   */
  public async getFileContent(fileId: string, userId: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const path = `uploads/${userId}/${fileId}`;
      const file = bucket.file(path);
      
      const [content] = await file.download();
      return content;
    } catch (error) {
      console.error(`Error retrieving file ${fileId}:`, error);
      throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(fileId: string, userId: string): Promise<UploadedFile | null> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const path = `uploads/${userId}/${fileId}`;
      const file = bucket.file(path);
      
      const [metadata] = await file.getMetadata();
      
      return {
        id: fileId,
        originalName: (metadata.metadata?.originalName as string) || '',
        fileName: metadata.name?.split('/').pop() || '',
        bucket: this.uploadBucket,
        path,
        size: parseInt((metadata.size as string) || '0'),
        contentType: metadata.contentType || '',
        uploadedAt: new Date(metadata.timeCreated || ''),
        userId,
        sessionId: (metadata.metadata?.sessionId as string) || undefined,
        metadata: metadata.metadata
      };
    } catch (error) {
      console.error(`Error getting file metadata ${fileId}:`, error);
      return null;
    }
  }

  /**
   * List user's uploaded files
   */
  public async listUserFiles(userId: string, limit: number = 50): Promise<UploadedFile[]> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const prefix = `uploads/${userId}/`;
      
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: limit
      });

      return files.map(file => {
        const fileName = file.name.split('/').pop() || '';
        const fileId = fileName.split('.')[0];
        
        return {
          id: fileId,
          originalName: (file.metadata.metadata?.originalName as string) || fileName,
          fileName,
          bucket: this.uploadBucket,
          path: file.name,
          size: parseInt((file.metadata.size as string) || '0'),
          contentType: file.metadata.contentType || '',
          uploadedAt: new Date(file.metadata.timeCreated || ''),
          userId,
          sessionId: (file.metadata.metadata?.sessionId as string) || undefined,
          metadata: file.metadata.metadata
        };
      });
    } catch (error) {
      console.error(`Error listing files for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Delete a file
   */
  public async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const path = `uploads/${userId}/${fileId}`;
      const file = bucket.file(path);
      
      await file.delete();
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Get signed URL for file access
   */
  public async getSignedUrl(fileId: string, userId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const path = `uploads/${userId}/${fileId}`;
      const file = bucket.file(path);
      
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000
      });
      
      return signedUrl;
    } catch (error) {
      console.error(`Error generating signed URL for ${fileId}:`, error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(fileBuffer: Buffer, originalName: string, contentType: string): { valid: boolean; error?: string } {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `File type ${contentType} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`
      };
    }

    // Check file name
    if (!originalName || originalName.length > 255) {
      return {
        valid: false,
        error: 'Invalid file name'
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Health check for upload service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.uploadBucket);
      const [exists] = await bucket.exists();
      return exists;
    } catch (error) {
      console.error('File upload service health check failed:', error);
      return false;
    }
  }

  /**
   * Get upload statistics for a user
   */
  public async getUserUploadStats(userId: string): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const files = await this.listUserFiles(userId, 1000); // Get up to 1000 files
      
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      return { totalFiles, totalSize };
    } catch (error) {
      console.error(`Error getting upload stats for user ${userId}:`, error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}
