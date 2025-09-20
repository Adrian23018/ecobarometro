import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsManagerComponent } from './questions-manager.component';

describe('QuestionsManagerComponent', () => {
  let component: QuestionsManagerComponent;
  let fixture: ComponentFixture<QuestionsManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
