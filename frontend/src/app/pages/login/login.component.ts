import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PixelAlertService } from '../../services/pixel-alert.service';
import { CustomValidators } from '../../utils/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: PixelAlertService
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
          this.alertService.success(`Welcome back, ${user.username}!`, 'Login Successful');
          if (user.role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/store']);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.alertService.error(this.errorMessage, 'Login Failed');
        }
      });
    }
  }
}