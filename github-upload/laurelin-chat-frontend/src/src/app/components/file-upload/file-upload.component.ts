import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatApiService, UploadedFile } from '../../services/chat-api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  @Input() sessionId: string | null = null;
  @Output() fileUploaded = new EventEmitter<UploadedFile>();
  @Output() fileRemoved = new EventEmitter<string>();

  uploadedFiles: UploadedFile[] = [];
  isDragOver = false;
  uploading = false;
  uploadProgress = 0;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  // Allowed file types
  private allowedTypes = [
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

  // Max file size (10MB)
  private maxFileSize = 10 * 1024 * 1024;

  constructor(private chatApiService: ChatApiService) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private async handleFiles(files: File[]): Promise<void> {
    this.error = null;

    for (const file of files) {
      if (this.validateFile(file)) {
        await this.uploadFile(file);
      }
    }
  }

  private validateFile(file: File): boolean {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      this.error = `File type ${file.type} is not allowed. Please upload: PDF, TXT, CSV, JSON, images, or Office documents.`;
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.error = `File size exceeds 10MB limit. Please choose a smaller file.`;
      return false;
    }

    // Check if file already exists
    if (this.uploadedFiles.some(f => f.originalName === file.name)) {
      this.error = `File "${file.name}" is already uploaded.`;
      return false;
    }

    return true;
  }

  private async uploadFile(file: File): Promise<void> {
    this.uploading = true;
    this.uploadProgress = 0;

    try {
      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 100);

      const result = await this.chatApiService.uploadFile(file, this.sessionId || undefined);
      
      clearInterval(progressInterval);
      this.uploadProgress = 100;

      if (result.success && result.file) {
        this.uploadedFiles.push(result.file);
        this.fileUploaded.emit(result.file);
        this.error = null;
      } else {
        this.error = result.error || 'Upload failed';
      }
    } catch (error: any) {
      this.error = error.message || 'Upload failed';
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }

  removeFile(fileId: string): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
    this.fileRemoved.emit(fileId);
  }

  getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('text/')) return '📝';
    if (contentType.includes('json')) return '📋';
    if (contentType.includes('csv')) return '📊';
    if (contentType.includes('word')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  clearError(): void {
    this.error = null;
  }
}
