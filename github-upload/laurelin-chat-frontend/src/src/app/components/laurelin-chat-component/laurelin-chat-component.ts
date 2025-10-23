import { AfterViewInit, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatSubmissionBox } from '../chat-submission-box/chat-submission-box';
import { LaurelinChatEntry } from '../laurelin-chat-entry/laurelin-chat-entry';
import { LaurelinChatPane } from '../laurelin-chat-pane/laurelin-chat-pane';
import { LaurelinChatStartup } from '../laurelin-chat-startup/laurelin-chat-startup';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { AuthService, GoogleUser } from '../../services/auth.service';
import { ChatApiService, ChatMessage, UploadedFile } from '../../services/chat-api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'laurelin-chat-component',
  templateUrl: './laurelin-chat-component.html',
  styleUrl: './laurelin-chat-component.css',
  imports: [
    ChatSubmissionBox, 
    LaurelinChatPane, 
    LaurelinChatStartup, 
    ModelSelectorComponent,
    FileUploadComponent,
    CommonModule, 
    FormsModule
  ]
})

export class LaurelinChatComponent implements OnInit, AfterViewInit, OnDestroy {
  renderStartupAnim: boolean = true;
  isAuthenticated = false;
  currentUser: GoogleUser | null = null;
  selectedProvider = 'google';
  selectedModel = 'gemini-pro';
  uploadedFiles: UploadedFile[] = [];
  chatMessages: ChatMessage[] = [];
  isLoading = false;
  error: string | null = null;

  @ViewChild('startupAnimation') startupAnim: LaurelinChatStartup = new LaurelinChatStartup();
  @ViewChild('chatPane') chatPane: LaurelinChatPane = new LaurelinChatPane();
  @ViewChild('submissionBox') submissionBox: ChatSubmissionBox = new ChatSubmissionBox();

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private chatApiService: ChatApiService
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        this.isAuthenticated = authState.isAuthenticated;
        this.currentUser = authState.user;
        this.error = authState.error;
        this.isLoading = authState.loading;

        if (this.isAuthenticated) {
          this.loadChatHistory();
        }
      });

    // Subscribe to session changes
    this.chatApiService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sessionId => {
        if (sessionId) {
          this.loadChatHistory(sessionId);
        }
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => { this.startupAnim.triggerFadein(); }, 50);
    setTimeout(() => {
      this.startupAnim.triggerFadeout();
      setTimeout(() => { this.renderStartupAnim = false; }, 1000);
    }, 3500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async signInWithGoogle(): Promise<void> {
    await this.authService.signInWithGoogle();
  }

  signOut(): void {
    this.authService.signOut();
    this.chatMessages = [];
    this.uploadedFiles = [];
    this.chatApiService.createNewSession();
  }

  onProviderChange(provider: string): void {
    this.selectedProvider = provider;
  }

  onModelChange(model: string): void {
    this.selectedModel = model;
  }

  onFileUploaded(file: UploadedFile): void {
    this.uploadedFiles.push(file);
  }

  onFileRemoved(fileId: string): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
  }

  async onChatSubmission(msg: string): Promise<void> {
    if (!msg.trim() || this.isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);
    this.chatPane.addChatEntry(-1, true, msg);

    this.isLoading = true;
    this.error = null;

    try {
      // Send message to backend
      const fileReferences = this.uploadedFiles.map(f => f.id);
      const response = await this.chatApiService.sendMessage(
        msg,
        this.selectedProvider,
        this.selectedModel,
        fileReferences
      );

      if (response.success && response.content) {
        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          modelUsed: response.model_used,
          provider: response.provider
        };
        this.chatMessages.push(assistantMessage);
        this.chatPane.addChatEntry(-1, false, response.content);
      } else {
        this.error = response.error || 'Failed to get response';
        this.chatPane.addChatEntry(-1, false, 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error: any) {
      console.error('Chat submission error:', error);
      this.error = error.message || 'Failed to send message';
      this.chatPane.addChatEntry(-1, false, 'Sorry, I\'m having trouble connecting. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadChatHistory(sessionId?: string): Promise<void> {
    try {
      const messages = await this.chatApiService.getChatHistory(sessionId);
      this.chatMessages = messages;
      
      // Update chat pane with loaded messages
      messages.forEach((msg, index) => {
        this.chatPane.addChatEntry(index, msg.role === 'user', msg.content);
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  createNewSession(): void {
    this.chatApiService.createNewSession();
    this.chatMessages = [];
    this.uploadedFiles = [];
    this.chatPane.clearMessages();
  }

  getUserDisplayName(): string {
    return this.currentUser?.name || 'User';
  }

  getUserEmail(): string {
    return this.currentUser?.email || '';
  }

  getUserAvatar(): string {
    return this.currentUser?.picture || '';
  }
}
