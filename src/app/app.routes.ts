import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { OrgChartComponent } from './pages/org-chart/org-chart.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: OrgChartComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
