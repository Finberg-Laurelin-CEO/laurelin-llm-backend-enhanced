import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaurelinChatComponent } from './laurelin-chat-component';

describe('LaurelinChatComponent', () => {
  let component: LaurelinChatComponent;
  let fixture: ComponentFixture<LaurelinChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaurelinChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaurelinChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
