import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-class-list-hero',
  templateUrl: './class-list-hero.html',
  styleUrl: './class-list-hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassListHero {
  showEditor = input(false);
  isInitialLoading = input(false);
  totalClasses = input(0);
  recentCount = input(0);

  createClass = output<void>();

  onCreateClass(): void {
    this.createClass.emit();
  }
}
