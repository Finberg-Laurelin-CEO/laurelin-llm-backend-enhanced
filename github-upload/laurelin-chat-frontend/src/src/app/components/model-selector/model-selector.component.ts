import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatApiService, ModelProvider } from '../../services/chat-api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-selector.component.html',
  styleUrls: ['./model-selector.component.css']
})
export class ModelSelectorComponent implements OnInit, OnDestroy {
  @Input() selectedProvider: string = 'google';
  @Input() selectedModel: string = 'gemini-pro';
  @Output() providerChange = new EventEmitter<string>();
  @Output() modelChange = new EventEmitter<string>();

  providers: ModelProvider[] = [];
  availableModels: string[] = [];
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private chatApiService: ChatApiService) {}

  ngOnInit(): void {
    this.loadModels();
    this.updateAvailableModels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadModels(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.providers = await this.chatApiService.getAvailableModels();
      this.updateAvailableModels();
    } catch (error) {
      console.error('Failed to load models:', error);
      this.error = 'Failed to load available models';
    } finally {
      this.loading = false;
    }
  }

  onProviderChange(providerName: string): void {
    this.selectedProvider = providerName;
    this.updateAvailableModels();
    this.providerChange.emit(providerName);
  }

  onModelChange(modelName: string): void {
    this.selectedModel = modelName;
    this.modelChange.emit(modelName);
  }

  private updateAvailableModels(): void {
    const provider = this.providers.find(p => p.name === this.selectedProvider);
    this.availableModels = provider?.models || [];
    
    // If current model is not available in the new provider, select the first available
    if (!this.availableModels.includes(this.selectedModel)) {
      this.selectedModel = this.availableModels[0] || '';
      this.modelChange.emit(this.selectedModel);
    }
  }

  getProviderDisplayName(provider: string): string {
    const displayNames: { [key: string]: string } = {
      'google': 'Google Gemini',
      'openai': 'OpenAI GPT',
      'aws-bedrock': 'AWS Bedrock',
      'custom-gpu': 'Custom GPU (OSS120)'
    };
    return displayNames[provider] || provider;
  }

  getModelDisplayName(model: string): string {
    const displayNames: { [key: string]: string } = {
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-haiku': 'Claude 3 Haiku',
      'claude-3-opus': 'Claude 3 Opus',
      'oss120': 'OSS120 (Custom)'
    };
    return displayNames[model] || model;
  }

  getProviderCapabilities(provider: string): string[] {
    const providerObj = this.providers.find(p => p.name === provider);
    if (!providerObj) return [];

    const capabilities = [];
    if (providerObj.capabilities.streaming) capabilities.push('Streaming');
    if (providerObj.capabilities.function_calling) capabilities.push('Function Calling');
    if (providerObj.capabilities.vision) capabilities.push('Vision');
    capabilities.push(`${providerObj.capabilities.max_tokens.toLocaleString()} max tokens`);
    
    return capabilities;
  }

  refreshModels(): void {
    this.loadModels();
  }
}
