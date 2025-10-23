import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSubmissionBox } from './chat-submission-box';

describe('ChatSubmissionBox', () => {
  let component: ChatSubmissionBox;
  let fixture: ComponentFixture<ChatSubmissionBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatSubmissionBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatSubmissionBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
