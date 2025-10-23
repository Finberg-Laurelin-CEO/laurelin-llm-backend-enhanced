import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'laurelin-chat-entry',
  imports: [CommonModule],
  templateUrl: './laurelin-chat-entry.html',
  styleUrl: './laurelin-chat-entry.css'
})
export class LaurelinChatEntry implements OnInit{

  doneLoading: boolean = false;
  bringInTextbox: boolean = false;

  @Input('ts') ts: number = -1;
  @Input('sent') sent: boolean = true;
  @Input('msg') msg: string = 'Default text';
  @Input('loading') loading: boolean = false;

  constructor() {
  }
  ngOnInit(): void {
    if ( !this.loading ) {
      this.bringInTextbox = true;
    }
  }
  completeLoadingAnim() {
    this.doneLoading = true;
    setTimeout(()=>{
      this.loading = false;
      this.bringInTextbox = true;
    }, 1000);
  }
}
