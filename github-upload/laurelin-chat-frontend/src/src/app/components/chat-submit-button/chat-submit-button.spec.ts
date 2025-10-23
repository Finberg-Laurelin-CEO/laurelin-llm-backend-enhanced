import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSubmitButton } from './chat-submit-button';

describe('ChatSubmitButton', () => {
  let component: ChatSubmitButton;
  let fixture: ComponentFixture<ChatSubmitButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatSubmitButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatSubmitButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
