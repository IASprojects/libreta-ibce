import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardMenu } from '../dashboard/dashboard-menu/dashboard-menu';

@Component({
  selector: 'app-main',
  imports: [RouterOutlet, DashboardMenu],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
