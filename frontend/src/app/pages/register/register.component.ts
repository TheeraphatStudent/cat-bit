import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1 class="register-title">Create Account</h1>
          <p class="register-subtitle">Join Cat bit and discover amazing games</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              [class.error]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
              placeholder="Enter your username">
            <div class="error-message" 
                 *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched">
              <span *ngIf="registerForm.get('username')?.errors?.['required']">Username is required</span>
              <span *ngIf="registerForm.get('username')?.errors?.['invalidUsername']">
                Username must be 3-20 characters, letters, numbers, and underscores only
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
              placeholder="Enter your email">
            <div class="error-message" 
                 *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="registerForm.get('email')?.errors?.['invalidEmail']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
              placeholder="Enter your password">
            <div class="error-message" 
                 *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="registerForm.get('password')?.errors?.['weakPassword']">
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword"
              [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
              placeholder="Confirm your password">
            <div class="error-message" 
                 *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
              <span *ngIf="registerForm.errors?.['passwordMismatch']">Passwords do not match</span>
            </div>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{errorMessage}}
          </div>

          <button type="submit" 
                  class="register-btn" 
                  [disabled]="registerForm.invalid || loading">
            {{loading ? 'Creating Account...' : 'Create Account'}}
          </button>
        </form>

        <div class="register-footer">
          <p>Already have an account? 
            <a routerLink="/login" class="login-link">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-primary-135);
      padding: var(--space-lg);
    }

    .register-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--space-2xl);
      width: 100%;
      max-width: 400px;
    }

    .register-header {
      text-align: center;
      margin-bottom: var(--space-xl);
    }

    .register-title {
      margin: 0 0 var(--space-sm) 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .register-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }

    .register-form {
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

    .register-btn {
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

    .register-btn:hover:not(:disabled) {
      background: var(--gradient-primary);
      transform: translateY(-1px);
    }

    .register-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .register-footer {
      text-align: center;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
    }

    .register-footer p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .login-link {
      color: var(--color-primary-2);
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
    }

    .login-link:hover {
      color: var(--color-primary-1);
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, CustomValidators.usernameValidator()]],
      email: ['', [Validators.required, CustomValidators.emailValidator()]],
      password: ['', [Validators.required, CustomValidators.passwordValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { confirmPassword, ...registerData } = this.registerForm.value;

      this.authService.register(registerData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}