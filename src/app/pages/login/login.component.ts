import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'] // Linked to external CSS
})
export class LoginComponent {
  username = '';
  password = '';
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    // 1. Validation
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Remember Me:', this.rememberMe);

    // 2. Auth Service Call
    this.auth.login({ u: this.username, p: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/org-chart']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Invalid credentials';
      }
    });
  }
}
