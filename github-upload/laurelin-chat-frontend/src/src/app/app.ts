import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LaurelinChatStartup } from './components/laurelin-chat-startup/laurelin-chat-startup';
import { CommonModule } from '@angular/common';
import { LaurelinChatEntry } from './components/laurelin-chat-entry/laurelin-chat-entry';
import { LaurelinChatPane } from './components/laurelin-chat-pane/laurelin-chat-pane';
import { ChatSubmissionBox } from './components/chat-submission-box/chat-submission-box';
import { LaurelinChatComponent } from './components/laurelin-chat-component/laurelin-chat-component';
import { ChatSubmitButton } from './components/chat-submit-button/chat-submit-button';

@Component({
  selector: 'app-root',
  imports: [LaurelinChatComponent, ChatSubmissionBox, ChatSubmitButton],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend-laurelin-chat');
}
