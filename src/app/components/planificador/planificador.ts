import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-planificador',
  imports: [RouterLink],
  templateUrl: './planificador.html',
  styleUrl: './planificador.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Planificador {}
