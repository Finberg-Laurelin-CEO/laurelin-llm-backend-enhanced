import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaurelinChatStartup } from './laurelin-chat-startup';

describe('LaurelinChatStartup', () => {
  let component: LaurelinChatStartup;
  let fixture: ComponentFixture<LaurelinChatStartup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaurelinChatStartup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaurelinChatStartup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
