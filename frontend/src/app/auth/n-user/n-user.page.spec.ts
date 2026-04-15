import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NUserPage } from './n-user.page';

describe('NUserPage', () => {
  let component: NUserPage;
  let fixture: ComponentFixture<NUserPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
