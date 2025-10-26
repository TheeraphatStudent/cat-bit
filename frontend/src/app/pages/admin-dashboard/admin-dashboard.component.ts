import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { GameService } from '../../services/game.service';
import { DiscountService } from '../../services/discount.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { GameTypeService } from '../../services/game-type.service';
import { PixelAlertService } from '../../services/pixel-alert.service';
import { Game } from '../../models/game.model';
import { User } from '../../models/user.model';
import { DiscountCode } from '../../models/discount.model';
import { WalletTransaction } from '../../models/wallet.model';
import { GameType } from '../../models/game-type.model';
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
  gameTypes: GameType[] = [];

  filteredGames: Game[] = [];
  filteredUsers: User[] = [];
  filteredDiscounts: DiscountCode[] = [];

  searchTerm = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  showGameModal = false;
  showDiscountModal = false;
  showUserModal = false;
  showTransactionModal = false;
  showGameTypeModal = false;

  editingGame: Game | null = null;
  editingDiscount: DiscountCode | null = null;
  editingUser: User | null = null;
  editingGameType: GameType | null = null;
  selectedUserTransactions: WalletTransaction[] = [];
  saving = false;
  loading = false;
  uploadingImage = false;
  selectedGameImage: File | null = null;
  gameImagePreview: string | null = null;

  gameForm: FormGroup;
  discountForm: FormGroup;
  userForm: FormGroup;
  gameTypeForm: FormGroup;

  private lastStatsLoad = 0;
  private lastGamesLoad = 0;
  private lastUsersLoad = 0;
  private lastDiscountsLoad = 0;
  private lastGameTypesLoad = 0;
  private readonly CACHE_DURATION = 60000;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private gameService: GameService,
    private discountService: DiscountService,
    private imageUploadService: ImageUploadService,
    private gameTypeService: GameTypeService,
    private alertService: PixelAlertService
  ) {
    this.gameForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      type: ['', Validators.required],
      description: [''],
      image: ['']
    });

    this.discountForm = this.fb.group({
      code: ['', Validators.required],
      discountValue: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      maxUsage: ['', [Validators.required, Validators.min(1)]],
      expireDate: ['']
    });

    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      wallet_balance: ['', [Validators.required, Validators.min(0)]]
    });

    this.gameTypeForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadGameTypes();
    this.loadDataForActiveTab();
  }

  private loadDataForActiveTab(): void {
    switch (this.activeTab) {
      case 'games':
        this.loadGames();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'discounts':
        this.loadDiscountCodes();
        break;
      case 'game-types':
        this.loadGameTypes();
        break;
    }
  }

  loadStats(): void {
    const now = Date.now();
    if (now - this.lastStatsLoad < this.CACHE_DURATION) {
      return;
    }

    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.lastStatsLoad = now;
      }
    });
  }

  loadGames(): void {
    const now = Date.now();
    if (now - this.lastGamesLoad < this.CACHE_DURATION && this.games.length > 0) {
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.gameService.getGames().subscribe({
      next: (games) => {
        this.games = games;
        this.lastGamesLoad = now;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    const now = Date.now();
    if (now - this.lastUsersLoad < this.CACHE_DURATION && this.users.length > 0) {
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.lastUsersLoad = now;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDiscountCodes(): void {
    const now = Date.now();
    if (now - this.lastDiscountsLoad < this.CACHE_DURATION && this.discountCodes.length > 0) {
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.discountService.getDiscountCodes().subscribe({
      next: (codes) => {
        this.discountCodes = codes;
        this.lastDiscountsLoad = now;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadGameTypes(): void {
    const now = Date.now();
    if (now - this.lastGameTypesLoad < this.CACHE_DURATION && this.gameTypes.length > 0) {
      return;
    }

    this.loading = true;
    this.gameTypeService.getGameTypes().subscribe({
      next: (types) => {
        this.gameTypes = types;
        this.lastGameTypesLoad = now;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.loadDataForActiveTab();
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  private applyFilters(): void {
    switch (this.activeTab) {
      case 'games':
        this.filteredGames = this.filterAndSortGames();
        break;
      case 'users':
        this.filteredUsers = this.filterAndSortUsers();
        break;
      case 'discounts':
        this.filteredDiscounts = this.filterAndSortDiscounts();
        break;
    }
  }

  private filterAndSortGames(): Game[] {
    let filtered = [...this.games];

    if (this.searchTerm) {
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(this.searchTerm) ||
        g.type.toLowerCase().includes(this.searchTerm)
      );
    }

    return this.sortArray(filtered, this.sortBy);
  }

  private filterAndSortUsers(): User[] {
    let filtered = [...this.users];

    if (this.searchTerm) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(this.searchTerm) ||
        u.email.toLowerCase().includes(this.searchTerm)
      );
    }

    return this.sortArray(filtered, this.sortBy);
  }

  private filterAndSortDiscounts(): DiscountCode[] {
    let filtered = [...this.discountCodes];

    if (this.searchTerm) {
      filtered = filtered.filter(d =>
        d.code.toLowerCase().includes(this.searchTerm)
      );
    }

    return this.sortArray(filtered, this.sortBy);
  }

  private sortArray(arr: any[], field: string): any[] {
    return arr.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  showAddGameModal(): void {
    this.editingGame = null;
    this.gameForm.reset();
    this.showGameModal = true;
  }

  editGame(game: Game): void {
    this.editingGame = game;
    this.selectedGameImage = null;
    this.gameImagePreview = game.image || null;
    this.gameForm.patchValue({
      name: game.name,
      price: game.price,
      type: game.type,
      description: game.description,
      image: game.image || ''
    });
    this.showGameModal = true;
  }

  closeGameModal(): void {
    this.showGameModal = false;
    this.editingGame = null;
    this.selectedGameImage = null;
    this.gameImagePreview = null;
  }

  onGameImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedGameImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.gameImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveGame(): void {
    if (this.gameForm.valid) {
      this.saving = true;

      // If there's a new image, upload it first
      if (this.selectedGameImage) {
        this.uploadingImage = true;
        this.imageUploadService.uploadImage(this.selectedGameImage).subscribe({
          next: (response) => {
            this.uploadingImage = false;
            const gameData = { ...this.gameForm.value, image: response.data.url };
            this.saveGameData(gameData);
          },
          error: (err) => {
            this.uploadingImage = false;
            this.saving = false;
            this.alertService.error(err.error?.message || 'Failed to upload image', 'Error');
          }
        });
      } else {
        this.saveGameData(this.gameForm.value);
      }
    }
  }

  private saveGameData(gameData: any): void {
    if (this.editingGame) {
      this.gameService.updateGame(this.editingGame.id!, gameData).subscribe({
        next: () => {
          this.saving = false;
          this.closeGameModal();
          this.lastGamesLoad = 0; // Force refresh
          this.loadGames();
          this.alertService.success('Game updated successfully!', 'Success');
        },
        error: (err) => {
          this.saving = false;
          this.alertService.error(err.error?.message || 'Failed to update game', 'Error');
        }
      });
    } else {
      this.gameService.createGame(gameData).subscribe({
        next: () => {
          this.saving = false;
          this.closeGameModal();
          this.lastGamesLoad = 0; // Force refresh
          this.loadGames();
          this.alertService.success('Game created successfully!', 'Success');
        },
        error: (err) => {
          this.saving = false;
          this.alertService.error(err.error?.message || 'Failed to create game', 'Error');
        }
      });
    }
  }

  deleteGame(game: Game): void {
    if (confirm(`Are you sure you want to delete "${game.name}"?`)) {
      this.gameService.deleteGame(game.id!).subscribe({
        next: () => {
          this.lastGamesLoad = 0; // Force refresh
          this.loadGames();
          this.alertService.success(`Game "${game.name}" deleted successfully!`, 'Success');
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Failed to delete game', 'Error');
        }
      });
    }
  }

  // User Management
  toggleUserRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    this.adminService.updateUserRole(user.id!, newRole).subscribe({
      next: () => {
        this.lastUsersLoad = 0; // Force refresh
        this.loadUsers();
        this.alertService.success(`User role updated to ${newRole}`, 'Success');
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Failed to update user role', 'Error');
      }
    });
  }

  toggleUserEdited(user: User): void {
    this.editingUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance || 0
    });
    this.showUserModal = true;
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.adminService.deleteUser(user.id!).subscribe({
        next: () => {
          this.lastUsersLoad = 0; // Force refresh
          this.loadUsers();
          this.alertService.success(`User "${user.username}" deleted successfully!`, 'Success');
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Failed to delete user', 'Error');
        }
      });
    }
  }

  closeUserModel(): void {
    this.showUserModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (this.userForm.valid && this.editingUser) {
      this.saving = true;
      const userData = this.userForm.value;

      this.adminService.updateUser(this.editingUser.id!, userData).subscribe({
        next: () => {
          this.saving = false;
          this.closeUserModel();
          this.lastUsersLoad = 0; // Force refresh
          this.loadUsers();
          this.alertService.success('User updated successfully!', 'Success');
        },
        error: (err) => {
          this.saving = false;
          this.alertService.error(err.error?.message || 'Failed to update user', 'Error');
        }
      });
    }
  }

  viewUserTransactions(user: User): void {
    this.editingUser = user;
    this.loading = true;
    this.adminService.getUserTransactions(user.id!).subscribe({
      next: (transactions) => {
        this.selectedUserTransactions = transactions;
        this.showTransactionModal = true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Failed to load transactions');
      }
    });
  }

  closeTransactionModal(): void {
    this.showTransactionModal = false;
    this.selectedUserTransactions = [];
    this.editingUser = null;
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
      discountValue: discount.discount_value,
      maxUsage: discount.max_usage,
      expireDate: discount.expire_date ? new Date(discount.expire_date).toISOString().split('T')[0] : ''
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
            this.lastDiscountsLoad = 0; // Force refresh
            this.loadDiscountCodes();
            this.alertService.success('Discount code updated successfully!', 'Success');
          },
          error: (err) => {
            this.saving = false;
            this.alertService.error(err.error?.message || 'Failed to update discount code', 'Error');
          }
        });
      } else {
        this.discountService.createDiscountCode(discountData).subscribe({
          next: () => {
            this.saving = false;
            this.closeDiscountModal();
            this.lastDiscountsLoad = 0; // Force refresh
            this.loadDiscountCodes();
            this.alertService.success('Discount code created successfully!', 'Success');
          },
          error: (err) => {
            this.saving = false;
            this.alertService.error(err.error?.message || 'Failed to create discount code', 'Error');
          }
        });
      }
    }
  }

  deleteDiscount(discount: DiscountCode): void {
    if (confirm(`Are you sure you want to delete discount code "${discount.code}"?`)) {
      this.discountService.deleteDiscountCode(discount.id!).subscribe({
        next: () => {
          this.lastDiscountsLoad = 0; // Force refresh
          this.loadDiscountCodes();
          this.alertService.success(`Discount code "${discount.code}" deleted successfully!`, 'Success');
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Failed to delete discount code', 'Error');
        }
      });
    }
  }

  // Game Type Management
  showAddGameTypeModal(): void {
    this.editingGameType = null;
    this.gameTypeForm.reset();
    this.showGameTypeModal = true;
  }

  editGameType(gameType: GameType): void {
    this.editingGameType = gameType;
    this.gameTypeForm.patchValue({
      name: gameType.name
    });
    this.showGameTypeModal = true;
  }

  closeGameTypeModal(): void {
    this.showGameTypeModal = false;
    this.editingGameType = null;
  }

  saveGameType(): void {
    if (this.gameTypeForm.valid) {
      this.saving = true;
      const gameTypeData = this.gameTypeForm.value;

      if (this.editingGameType) {
        this.gameTypeService.updateGameType(this.editingGameType.id!, gameTypeData).subscribe({
          next: () => {
            this.saving = false;
            this.closeGameTypeModal();
            this.lastGameTypesLoad = 0; // Force refresh
            this.loadGameTypes();
            this.alertService.success('Game type updated successfully!', 'Success');
          },
          error: (err) => {
            this.saving = false;
            this.alertService.error(err.error?.message || 'Failed to update game type', 'Error');
          }
        });
      } else {
        this.gameTypeService.createGameType(gameTypeData).subscribe({
          next: () => {
            this.saving = false;
            this.closeGameTypeModal();
            this.lastGameTypesLoad = 0; // Force refresh
            this.loadGameTypes();
            this.alertService.success('Game type created successfully!', 'Success');
          },
          error: (err) => {
            this.saving = false;
            this.alertService.error(err.error?.message || 'Failed to create game type', 'Error');
          }
        });
      }
    }
  }

  deleteGameType(gameType: GameType): void {
    if (confirm(`Are you sure you want to delete game type "${gameType.name}"?`)) {
      this.gameTypeService.deleteGameType(gameType.id!).subscribe({
        next: () => {
          this.lastGameTypesLoad = 0; // Force refresh
          this.loadGameTypes();
          this.alertService.success(`Game type "${gameType.name}" deleted successfully!`, 'Success');
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Failed to delete game type', 'Error');
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