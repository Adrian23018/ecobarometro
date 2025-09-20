import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersAnalyticsComponent } from './users-analytics.component';

describe('UsersAnalyticsComponent', () => {
  let component: UsersAnalyticsComponent;
  let fixture: ComponentFixture<UsersAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
