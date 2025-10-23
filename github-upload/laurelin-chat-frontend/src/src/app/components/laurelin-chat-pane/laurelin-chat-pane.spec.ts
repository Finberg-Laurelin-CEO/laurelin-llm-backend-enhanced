import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaurelinChatPane } from './laurelin-chat-pane';

describe('LaurelinChatPane', () => {
  let component: LaurelinChatPane;
  let fixture: ComponentFixture<LaurelinChatPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaurelinChatPane]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaurelinChatPane);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
