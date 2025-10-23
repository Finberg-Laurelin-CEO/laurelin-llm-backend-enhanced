import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'chat-submit-button',
  imports: [CommonModule],
  templateUrl: './chat-submit-button.html',
  styleUrl: './chat-submit-button.css'
})
export class ChatSubmitButton {

  mouseDown: boolean = false;

  @Output("onSubmit") onSubmit: EventEmitter<boolean> = new EventEmitter();

  onMouseDown() {
    this.mouseDown = true;
  }
  
  onMouseUp() {
    this.mouseDown = false;
  }
  
  onMouseLeave() {
    this.mouseDown = false;
  }


  handleClick(): void {
    this.onSubmit.emit(true);
  }
}
