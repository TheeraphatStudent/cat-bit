import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SoundService } from './services/sound.service';
import { filter } from 'rxjs/operators';
import { PixelGrid } from './components/pixel-grid/pixel-grid';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PixelAlertComponent } from './components/pixel-alert/pixel-alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PixelGrid, NavbarComponent, PixelAlertComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showNavbar = true;
  private noNavbarRoutes = ['/login', '/register'];

  constructor(
    private router: Router,
    private soundService: SoundService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showNavbar = !this.noNavbarRoutes.includes(event.url);
    });
  }

  // ngOnInit(): void {
  // }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.soundService.playClick();
    this.soundService.enableBackgroundMusic();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.soundService.playDelete();
      this.soundService.enableBackgroundMusic();
    }

    else if (/^[a-zA-Z0-9]$|^(Space|Enter|Tab)$/.test(event.key)) {
      this.soundService.playTyping();
      this.soundService.enableBackgroundMusic();
    }
  }

  @HostListener('document:mouseover', ['$event'])
  onDocumentMouseover(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.dataset['hoverSoundPlayed']) {
      return;
    }

    if (target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'OPTION' ||
      target.tagName === 'INPUT' ||
      target.classList.contains('nav-link') ||
      target.classList.contains('game-card')) {
      this.soundService.playHover();
      target.dataset['hoverSoundPlayed'] = 'true';
    }
  }

  @HostListener('document:mouseout', ['$event'])
  onDocumentMouseout(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.dataset['hoverSoundPlayed']) {
      delete target.dataset['hoverSoundPlayed'];
    }
  }
}