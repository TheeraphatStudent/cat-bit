import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { GameService } from '../../services/game.service';
import { DiscountService } from '../../services/discount.service';
import { Game } from '../../models/game.model';
import { User } from '../../models/user.model';
import { DiscountCode } from '../../models/discount.model';
import { PriceFormat } from '../../utils/price-format';
import { DateFormat } from '../../utils/date-format';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 'games';
  stats: any = {
    totalUsers: 0,
    totalGames: 0,
    totalSales: 0,
    totalRevenue: 0
  };
  
  games: Game[] = [];
  users: User[] = [];
  discountCodes: DiscountCode[] = [];
  
  showGameModal = false;
  showDiscountModal = false;
  editingGame: Game | null = null;
  editingDiscount: DiscountCode | null = null;
  saving = false;
  
  gameForm: FormGroup;
  discountForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private gameService: GameService,
    private discountService: DiscountService
  ) {
    this.gameForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      type: ['', Validators.required],
      description: ['']
    });

    this.discountForm = this.fb.group({
      code: ['', Validators.required],
      discountValue: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      maxUsage: ['', [Validators.required, Validators.min(1)]],
      expireDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadGames();
    this.loadUsers();
    this.loadDiscountCodes();
  }

  loadStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
  }

  loadGames(): void {
    this.gameService.getGames().subscribe({
      next: (games) => {
        this.games = games;
      }
    });
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      }
    });
  }

  loadDiscountCodes(): void {
    this.discountService.getDiscountCodes().subscribe({
      next: (codes) => {
        this.discountCodes = codes;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Game Management
  showAddGameModal(): void {
    this.editingGame = null;
    this.gameForm.reset();
    this.showGameModal = true;
  }

  editGame(game: Game): void {
    this.editingGame = game;
    this.gameForm.patchValue({
      name: game.name,
      price: game.price,
      type: game.type,
      description: game.description
    });
    this.showGameModal = true;
  }

  closeGameModal(): void {
    this.showGameModal = false;
    this.editingGame = null;
  }

  saveGame(): void {
    if (this.gameForm.valid) {
      this.saving = true;
      const gameData = this.gameForm.value;

      if (this.editingGame) {
        this.gameService.updateGame(this.editingGame.id!, gameData).subscribe({
          next: () => {
            this.saving = false;
            this.closeGameModal();
            this.loadGames();
          },
          error: () => {
            this.saving = false;
          }
        });
      } else {
        this.gameService.createGame(gameData).subscribe({
          next: () => {
            this.saving = false;
            this.closeGameModal();
            this.loadGames();
          },
          error: () => {
            this.saving = false;
          }
        });
      }
    }
  }

  deleteGame(game: Game): void {
    if (confirm(`Are you sure you want to delete "${game.name}"?`)) {
      this.gameService.deleteGame(game.id!).subscribe({
        next: () => {
          this.loadGames();
        }
      });
    }
  }

  // User Management
  toggleUserRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    this.adminService.updateUserRole(user.id!, newRole).subscribe({
      next: () => {
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.adminService.deleteUser(user.id!).subscribe({
        next: () => {
          this.loadUsers();
        }
      });
    }
  }

  // Discount Management
  showAddDiscountModal(): void {
    this.editingDiscount = null;
    this.discountForm.reset();
    this.showDiscountModal = true;
  }

  editDiscount(discount: DiscountCode): void {
    this.editingDiscount = discount;
    this.discountForm.patchValue({
      code: discount.code,
      discountValue: discount.discountValue,
      maxUsage: discount.maxUsage,
      expireDate: discount.expireDate ? new Date(discount.expireDate).toISOString().split('T')[0] : ''
    });
    this.showDiscountModal = true;
  }

  closeDiscountModal(): void {
    this.showDiscountModal = false;
    this.editingDiscount = null;
  }

  saveDiscount(): void {
    if (this.discountForm.valid) {
      this.saving = true;
      const discountData = this.discountForm.value;

      if (this.editingDiscount) {
        this.discountService.updateDiscountCode(this.editingDiscount.id!, discountData).subscribe({
          next: () => {
            this.saving = false;
            this.closeDiscountModal();
            this.loadDiscountCodes();
          },
          error: () => {
            this.saving = false;
          }
        });
      } else {
        this.discountService.createDiscountCode(discountData).subscribe({
          next: () => {
            this.saving = false;
            this.closeDiscountModal();
            this.loadDiscountCodes();
          },
          error: () => {
            this.saving = false;
          }
        });
      }
    }
  }

  deleteDiscount(discount: DiscountCode): void {
    if (confirm(`Are you sure you want to delete discount code "${discount.code}"?`)) {
      this.discountService.deleteDiscountCode(discount.id!).subscribe({
        next: () => {
          this.loadDiscountCodes();
        }
      });
    }
  }

  formatPrice(price: number): string {
    return PriceFormat.formatCurrency(price);
  }

  formatDate(date: Date | string): string {
    return DateFormat.formatDate(date);
  }
}