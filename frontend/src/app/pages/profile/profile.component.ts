import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletBalanceComponent } from '../../components/wallet-balance/wallet-balance.component';
import { TransactionHistoryComponent } from '../../components/transaction-history/transaction-history.component';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { User } from '../../models/user.model';
import { WalletTransaction } from '../../models/wallet.model';
import { CustomValidators } from '../../utils/validators';
import { ImageUploadService } from '../../services/image-upload.service';
import { finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, WalletBalanceComponent, TransactionHistoryComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  currentUser: User | null = null;
  profileForm: FormGroup;
  walletBalance = 0;
  transactions: WalletTransaction[] = [];
  updating = false;
  toppingUp = false;
  showDeleteModal = false;
  deleting = false;
  uploadingImage = false;
  imageUploadError = '';
  readonly maxAvatarSize = 5 * 1024 * 1024; // 5 MB limit

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private walletService: WalletService,
    private router: Router,
    private imageUploadService: ImageUploadService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, CustomValidators.usernameValidator()]],
      email: ['', [Validators.required, CustomValidators.emailValidator()]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadWalletData();
    this.loadTransactions();
  }

  loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          username: user.username,
          email: user.email
        });
        this.walletBalance = user.walletBalance || 0;
      }
    });
  }

  loadWalletData(): void {
    this.walletService.getBalance().subscribe({
      next: (response) => {
        this.walletBalance = response.balance;
      }
    });
  }

  loadTransactions(): void {
    this.walletService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.updating = true;
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: () => {
          this.updating = false;
        },
        error: () => {
          this.updating = false;
        }
      });
    }
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
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

    this.imageUploadError = '';
    this.uploadingImage = true;

    this.imageUploadService.uploadImage(file).pipe(
      switchMap(response => this.authService.updateProfile({ profileImage: response.data.url })),
      finalize(() => {
        this.uploadingImage = false;
        input.value = '';
      })
    ).subscribe({
      next: () => {
        this.imageUploadError = '';
      },
      error: (error) => {
        console.error('Profile image update failed:', error);
        this.imageUploadError = 'Unable to update profile image. Please try again.';
      }
    });
  }

  get profileImageUrl(): string {
    return this.currentUser?.profileImage || '/assets/images/logo.png';
  }

  onTopUp(amount: number): void {
    this.toppingUp = true;
    this.walletService.topUp({ amount }).subscribe({
      next: (response) => {
        this.walletBalance = response.balance;
        this.loadTransactions();
        this.toppingUp = false;
      },
      error: () => {
        this.toppingUp = false;
      }
    });
  }

  confirmDeleteAccount(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  deleteAccount(): void {
    this.deleting = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigate(['/store']);
      },
      error: () => {
        this.deleting = false;
      }
    });
  }
}
