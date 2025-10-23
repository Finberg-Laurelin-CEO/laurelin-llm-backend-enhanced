import { Component, OnInit } from '@angular/core';
import { LaurelinChatEntry } from '../laurelin-chat-entry/laurelin-chat-entry';
import { CommonModule } from '@angular/common';

class ChatEntry {
  ts: number = -1;
  sent: boolean = true;
  msg: string = 'Default text.';

  constructor(ts: number=-1, sent: boolean=true, msg: string='Default text.') {
    this.ts = ts;
    this.sent = sent;
    this.msg = msg;
  }
}

@Component({
  selector: 'laurelin-chat-pane',
  imports: [CommonModule, LaurelinChatEntry],
  templateUrl: './laurelin-chat-pane.html',
  styleUrl: './laurelin-chat-pane.css'
})
export class LaurelinChatPane implements OnInit{
  
  entries: ChatEntry[] = [];

  constructor() {}
  ngOnInit(): void {}

  addChatEntry(ts: number=-1, sent: boolean=true, msg: string='Default text.') {
    if ( ts < 0 ) {
      ts = +new Date(); // I hate this syntax as much as you do.
    }
    this.entries.push( new ChatEntry(ts, sent, msg) );
  }
}
