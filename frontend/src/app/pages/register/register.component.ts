import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PixelAlertService } from '../../services/pixel-alert.service';
import { CustomValidators } from '../../utils/validators';
import { ImageUploadService } from '../../services/image-upload.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  uploadingImage = false;
  imageUploadError = '';
  profilePreview = '/assets/images/logo.png';
  readonly maxAvatarSize = 5 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private imageUploadService: ImageUploadService,
    private alertService: PixelAlertService
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, CustomValidators.usernameValidator()]],
      email: ['', [Validators.required, CustomValidators.emailValidator()]],
      password: ['', [Validators.required, CustomValidators.passwordValidator()]],
      confirmPassword: ['', [Validators.required]],
      profileImage: ['']
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

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.imageUploadError = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > this.maxAvatarSize) {
      this.imageUploadError = 'Image is too large. Please choose a file under 5MB.';
      input.value = '';
      return;
    }

    this.setLocalPreview(file);
    this.imageUploadError = '';
    this.uploadingImage = true;

    this.imageUploadService.uploadImage(file).pipe(
      finalize(() => {
        this.uploadingImage = false;
        input.value = '';
      })
    ).subscribe({
      next: (response) => {
        this.registerForm.patchValue({ profileImage: response.data.url });
        this.alertService.success('Profile image uploaded successfully');
      },
      error: (error) => {
        console.error('Profile image upload failed:', error);
        this.imageUploadError = 'Unable to upload image. Please try again.';
        this.alertService.error(this.imageUploadError, 'Upload Failed');
        this.registerForm.patchValue({ profileImage: '' });
        this.profilePreview = '/assets/images/logo.png';
      }
    });
  }

  private setLocalPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { confirmPassword, ...registerData } = this.registerForm.value;

      this.authService.register(registerData).subscribe({
        next: () => {
          this.loading = false;
          this.alertService.success('Account created! Please login to continue.', 'Registration Successful');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.alertService.error(this.errorMessage, 'Registration Failed');
        }
      });
    }
  }
}
