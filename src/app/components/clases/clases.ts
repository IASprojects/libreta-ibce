import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-clases',
  imports: [RouterLink],
  templateUrl: './clases.html',
  styleUrl: './clases.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clases {}
