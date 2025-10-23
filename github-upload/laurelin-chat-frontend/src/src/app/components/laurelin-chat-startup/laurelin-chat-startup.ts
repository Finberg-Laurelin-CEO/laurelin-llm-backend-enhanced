import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'laurelin-chat-startup',
  imports: [CommonModule],
  templateUrl: './laurelin-chat-startup.html',
  styleUrl: './laurelin-chat-startup.css'
})
export class LaurelinChatStartup implements OnInit{

  // Various startup messages that can be displayed.
  startupMessages: string[] = [
    "Hi! I'm Laurelin. What are we doing today?",
    "Hi! I'm Laurelin. What's up?",
    "Hi there! I'm Laurelin. Let's get to work.",
    "Hi there! I'm Laurelin. What's on your mind?",
    "Hello! I'm Laurelin. Are you having a good day?",
    "Hello! I'm Laurelin. How 'bout this weather today?"
  ];

  // Whether or not we're fading in. This is used to trigger the
  // css class that contains the CSS animation.
  fadeIn: boolean = false;
  // Same thing for fadeout.
  fadeOut: boolean = false;
  // And for the expansion. This is done with a cover over the text so we
  // don't have to reveal the message letter by letter but pixel by pixel.
  expand: boolean = false;
  // The output text.
  outputText: string = '';

  // An event emitter for when the animation completes.
  @Output('onComplete') onComplete: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() {}

  /**
   * Triggers the fading out and hiding of the component.
   */
  triggerFadeout(): void {
        this.fadeOut = true;
        setTimeout( ()=>{
          this.onComplete.emit(true);
        },1000);
  }

  triggerFadein(): void {
    // Choose a random startup message.
    let chosenMessage = this.startupMessages[ Math.floor( Math.random()*this.startupMessages.length ) ];
    this.outputText = chosenMessage;
    this.fadeIn = true;
    this.expand = true;
  }

  /**
   * Angular lifecycle hook. Called when the component is created.
   */
  ngOnInit(): void {
  }

}
