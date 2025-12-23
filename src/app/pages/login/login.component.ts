import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-box">
        <h2>Sign In</h2>
        <input [(ngModel)]="username" placeholder="Username (admin)" class="input-field">
        <input [(ngModel)]="password" type="password" placeholder="Password (1234)" class="input-field">
        <button (click)="login()" class="btn-primary">Login</button>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper { height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f2f5; }
    .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 300px; text-align: center; }
    .input-field { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    .btn-primary { width: 100%; padding: 10px; background: #800040; color: white; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class LoginComponent {
  username = ''; password = '';
  constructor(private auth: AuthService, private router: Router) {}
  login() {
    this.auth.login({ u: this.username, p: this.password }).subscribe(() => this.router.navigate(['/dashboard']));
  }
}
