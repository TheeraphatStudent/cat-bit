import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../utils/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">Welcome Back</h1>
          <p class="login-subtitle">Sign in to your Cat bit account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="Enter your email">
            <div class="error-message" 
                 *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="loginForm.get('email')?.errors?.['invalidEmail']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Enter your password">
            <div class="error-message" 
                 *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{errorMessage}}
          </div>

          <button type="submit" 
                  class="login-btn" 
                  [disabled]="loginForm.invalid || loading">
            {{loading ? 'Signing In...' : 'Sign In'}}
          </button>
        </form>

        <div class="login-footer">
          <p>Don't have an account? 
            <a routerLink="/register" class="register-link">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-primary-135);
      padding: var(--space-lg);
    }

    .login-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--space-2xl);
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .login-title {
      margin: 0 0 var(--space-sm) 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .login-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }

    .login-form {
      margin-bottom: var(--space-lg);
    }

    .form-group {
      margin-bottom: var(--space-lg);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .form-group input {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      transition: all var(--transition-base);
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary-2);
      box-shadow: 0 0 0 3px rgba(249, 195, 62, 0.1);
    }

    .form-group input.error {
      border-color: var(--color-error);
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--font-size-sm);
      margin-top: var(--space-xs);
    }

    .login-btn {
      width: 100%;
      padding: var(--space-sm);
      background: var(--gradient-primary-135);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--transition-base);
      margin-top: var(--space-sm);
    }

    .login-btn:hover:not(:disabled) {
      background: var(--gradient-primary);
      transform: translateY(-1px);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-footer {
      text-align: center;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
    }

    .login-footer p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .register-link {
      color: var(--color-primary-2);
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
    }

    .register-link:hover {
      color: var(--color-primary-1);
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, CustomValidators.emailValidator()]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (user) => {
          this.loading = false;
          if (user.role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/store']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    }
  }
}