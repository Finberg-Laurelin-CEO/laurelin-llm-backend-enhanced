import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaurelinChatEntry } from './laurelin-chat-entry';

describe('LaurelinChatEntry', () => {
  let component: LaurelinChatEntry;
  let fixture: ComponentFixture<LaurelinChatEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaurelinChatEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaurelinChatEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
