import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { OrgChartComponent } from './pages/org-chart/org-chart.component';
import { authGuard } from './guards/auth.guard';
import { DashboardsComponent } from './pages/dashboard/dashboards.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: 'org-chart', component: OrgChartComponent, canActivate: [authGuard] },

  { path: 'dashboard', component: DashboardsComponent, canActivate: [authGuard] },

  { path: '', redirectTo: '/org-chart', pathMatch: 'full' }
];
