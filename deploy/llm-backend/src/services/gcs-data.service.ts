import { Storage } from '@google-cloud/storage';
import { ConfigService } from './config.service';

export interface GCSFile {
  name: string;
  bucket: string;
  size: number;
  contentType: string;
  created: Date;
  updated: Date;
  content?: string;
}

export interface DataSource {
  bucket: string;
  prefix?: string;
  description: string;
  enabled: boolean;
}

export class GCSDataService {
  private storage: Storage;
  private config: ConfigService;
  private dataSources: DataSource[] = [];

  constructor() {
    this.config = ConfigService.getInstance();
    this.storage = new Storage({
      projectId: this.config.getConfig().googleCloudProject
    });
    
    // Initialize data sources from environment or default
    this.initializeDataSources();
  }

  private initializeDataSources(): void {
    try {
      const sourcesConfig = process.env.GCS_DATA_SOURCES;
      if (sourcesConfig) {
        this.dataSources = JSON.parse(sourcesConfig);
      } else {
        // Default data sources - Laurelin Inc buckets
        this.dataSources = [
          {
            bucket: 'knowledge-base-bucket-sacred-attic-473120-i0',
            prefix: '',
            description: 'Knowledge base with dataset.jsonl, Hugging Face data, OCR, and vector search',
            enabled: true
          },
          {
            bucket: 'knowledge-base-docs-sacred-attic-473120-i0',
            prefix: '',
            description: 'PDF documents and research papers',
            enabled: true
          },
          {
            bucket: 'laurelin-jet-data',
            prefix: '',
            description: 'JET dataset (HDF5 files)',
            enabled: true
          },
          {
            bucket: 'laurelin-training-data',
            prefix: '',
            description: 'Training data and PDF documents',
            enabled: true
          },
          {
            bucket: 'laurelin-data-bucket',
            prefix: 'reports/',
            description: 'Analytics and reports',
            enabled: true
          }
        ];
      }
    } catch (error) {
      console.error('Error parsing GCS data sources config:', error);
      this.dataSources = [];
    }
  }

  /**
   * Get all available data sources
   */
  public getDataSources(): DataSource[] {
    return this.dataSources.filter(source => source.enabled);
  }

  /**
   * List files from a specific data source
   */
  public async listFiles(source: DataSource, limit: number = 50): Promise<GCSFile[]> {
    try {
      const bucket = this.storage.bucket(source.bucket);
      const options: any = {
        maxResults: limit
      };

      if (source.prefix) {
        options.prefix = source.prefix;
      }

      const [files] = await bucket.getFiles(options);
      
      return files.map(file => ({
        name: file.name,
        bucket: source.bucket,
        size: file.metadata.size ? parseInt(file.metadata.size as string) : 0,
        contentType: file.metadata.contentType || 'application/octet-stream',
        created: new Date(file.metadata.timeCreated || ''),
        updated: new Date(file.metadata.updated || '')
      }));
    } catch (error) {
      console.error(`Error listing files from ${source.bucket}/${source.prefix}:`, error);
      return [];
    }
  }

  /**
   * Get file content as text
   */
  public async getFileContent(bucketName: string, fileName: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);
      
      const [content] = await file.download();
      return content.toString('utf-8');
    } catch (error) {
      console.error(`Error reading file ${bucketName}/${fileName}:`, error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for files by name pattern across all data sources
   */
  public async searchFiles(query: string, limit: number = 20): Promise<GCSFile[]> {
    const results: GCSFile[] = [];
    
    for (const source of this.getDataSources()) {
      try {
        const files = await this.listFiles(source, limit);
        const matchingFiles = files.filter(file => 
          file.name.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...matchingFiles);
      } catch (error) {
        console.error(`Error searching in ${source.bucket}:`, error);
      }
    }
    
    return results.slice(0, limit);
  }

  /**
   * Get relevant data for a chat query
   */
  public async getRelevantData(query: string, maxFiles: number = 5): Promise<GCSFile[]> {
    // Simple keyword-based search - could be enhanced with semantic search
    const keywords = this.extractKeywords(query);
    const results: GCSFile[] = [];
    
    for (const keyword of keywords) {
      const files = await this.searchFiles(keyword, maxFiles);
      results.push(...files);
    }
    
    // Remove duplicates and limit results
    const uniqueFiles = results.filter((file, index, self) => 
      index === self.findIndex(f => f.name === file.name && f.bucket === file.bucket)
    );
    
    return uniqueFiles.slice(0, maxFiles);
  }

  /**
   * Get context data for LLM requests
   */
  public async getContextData(query: string, maxContextLength: number = 4000): Promise<string> {
    const relevantFiles = await this.getRelevantData(query, 3);
    let context = '';
    
    for (const file of relevantFiles) {
      try {
        const content = await this.getFileContent(file.bucket, file.name);
        
        // Truncate content if too long
        const truncatedContent = content.length > 1000 
          ? content.substring(0, 1000) + '...' 
          : content;
        
        context += `\n\n--- File: ${file.name} ---\n${truncatedContent}`;
        
        if (context.length > maxContextLength) {
          break;
        }
      } catch (error) {
        console.error(`Error reading file ${file.name} for context:`, error);
      }
    }
    
    return context;
  }

  /**
   * Extract keywords from a query for search
   */
  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - remove common words and extract meaningful terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'when', 'where', 'why', 'who']);
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Health check for GCS connectivity
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test by listing buckets
      const [buckets] = await this.storage.getBuckets();
      return buckets.length >= 0; // Just check if we can connect
    } catch (error) {
      console.error('GCS health check failed:', error);
      return false;
    }
  }

  /**
   * Add a new data source
   */
  public addDataSource(source: DataSource): void {
    this.dataSources.push(source);
  }

  /**
   * Remove a data source
   */
  public removeDataSource(bucket: string, prefix?: string): void {
    this.dataSources = this.dataSources.filter(source => 
      !(source.bucket === bucket && source.prefix === prefix)
    );
  }
}
