import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardMenu } from './dashboard-menu';

describe('DashboardMenu', () => {
  let component: DashboardMenu;
  let fixture: ComponentFixture<DashboardMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardMenu, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 menu items', () => {
    expect(component.menuItems.length).toBe(5);
  });

  it('should toggle menu state', () => {
    const initialState = component.isMenuOpen();
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(!initialState);
  });

  it('should close menu', () => {
    component.isMenuOpen.set(true);
    component.closeMenu();
    expect(component.isMenuOpen()).toBe(false);
  });

  it('should have correct menu item routes', () => {
    const routes = component.menuItems.map(item => item.route);
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/dashboard/estudiantes');
    expect(routes).toContain('/dashboard/planificador');
    expect(routes).toContain('/dashboard/clases');
    expect(routes).toContain('/dashboard/configuracion');
  });
});
