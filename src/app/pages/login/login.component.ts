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

    // 2. Validate Credentials (Hardcoded check)
    // Check if user is 'admin' and password is '12345'
    if (this.username === 'admin' && this.password === '12345') {

      // If correct, call the service to set the session
      this.auth.login({ u: this.username, p: this.password }).subscribe({
        next: () => {
          // Success: Go to Org Chart
          this.router.navigate(['/org-chart']);
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Login system error';
        }
      });

    } else {
      // If incorrect, stop loading and show error
      // Use setTimeout to simulate a small network delay (optional, looks better)
      setTimeout(() => {
        this.isLoading = false;
        this.errorMessage = 'The username or password is incorrect';
      }, 500);
    }
  }
}
