import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private clickAudio: HTMLAudioElement;
  private backgroundAudio: HTMLAudioElement;
  private typingAudio: HTMLAudioElement;
  private deleteAudio: HTMLAudioElement;
  private hoverAudio: HTMLAudioElement;
  private backgroundMusicEnabled: boolean = false;

  constructor() {
    this.clickAudio = new Audio('assets/sound/click.mp3');
    this.typingAudio = new Audio('assets/sound/typing.mp3');
    this.deleteAudio = new Audio('assets/sound/delete.mp3');
    this.hoverAudio = new Audio('assets/sound/hover.mp3');
    this.backgroundAudio = new Audio('assets/sound/background.mp3');

    this.backgroundAudio.loop = true;

    this.clickAudio.volume = 0.15;
    this.backgroundAudio.volume = 0.05;
    this.typingAudio.volume = 0.2;
    this.deleteAudio.volume = 0.2;
    this.hoverAudio.volume = 0.15;
  }

  playClick(): void {
    this.clickAudio.currentTime = 0;
    this.clickAudio.play().catch(error => {
      console.error('Error playing click sound:', error);
    });
  }

  playHover(): void {
    this.hoverAudio.currentTime = 0;
    this.hoverAudio.play().catch(() => {
    });
  }

  playTyping(): void {
    this.typingAudio.currentTime = 0;
    this.typingAudio.play().catch(error => {
      console.error('Error playing typing sound:', error);
    });
  }

  playDelete(): void {
    this.deleteAudio.currentTime = 0;
    this.deleteAudio.play().catch(error => {
      console.error('Error playing delete sound:', error);
    });
  }

  playBackgroundMusic(): void {
    if (!this.backgroundMusicEnabled) {
      this.backgroundMusicEnabled = true;
      this.backgroundAudio.play().catch(error => {
        console.error('Error playing background music:', error);
        this.backgroundMusicEnabled = false;
      });
    }
  }

  pauseBackgroundMusic(): void {
    this.backgroundMusicEnabled = false;
    this.backgroundAudio.pause();
  }

  setBackgroundVolume(volume: number): void {
    this.backgroundAudio.volume = Math.max(0, Math.min(1, volume));
  }

  setTypingVolume(volume: number): void {
    this.typingAudio.volume = Math.max(0, Math.min(1, volume));
  }

  setDeleteVolume(volume: number): void {
    this.deleteAudio.volume = Math.max(0, Math.min(1, volume));
  }

  setHoverVolume(volume: number): void {
    this.hoverAudio.volume = Math.max(0, Math.min(1, volume));
  }

  enableBackgroundMusic(): void {
    if (!this.backgroundMusicEnabled) {
      this.playBackgroundMusic();
    }
  }
}
