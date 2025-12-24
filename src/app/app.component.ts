import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FormsModule,
    DragDropModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // State variables
  isLoggedIn = false;
  showProfileMenu = false;
  user: any;
  isSidebarCollapsed = true;

  // Theme & Language settings
  themeColors = ['#f5f5f5', '#e3f2fd', '#fce4ec', '#fff3e0', '#333333'];
  currentLang = 'EN';

  constructor(
    public auth: AuthService,
    private theme: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check login status
    this.auth.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) this.user = this.auth.userProfile;
    });
  }

  // Actions
  toggleLanguage() {
    this.currentLang = this.currentLang === 'EN' ? 'TH' : 'EN';
  }

  changeBackground(color: string) {
    this.theme.setBackground(color);
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.showProfileMenu = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
