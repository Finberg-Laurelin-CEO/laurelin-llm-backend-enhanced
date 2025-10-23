import { Component, EventEmitter, Output } from '@angular/core';
import { ChatSubmitButton } from '../chat-submit-button/chat-submit-button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'chat-submission-box',
  imports: [ChatSubmitButton, FormsModule],
  templateUrl: './chat-submission-box.html',
  styleUrl: './chat-submission-box.css'
})
export class ChatSubmissionBox {

  textareaContent: string = '';

  @Output("onSubmit") onSubmit: EventEmitter<string> = new EventEmitter();

  onSubmitClick(evt: boolean): void {
    this.onSubmit.emit(this.textareaContent);
  }
  
}
