import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private clickAudio: HTMLAudioElement;
  private backgroundAudio: HTMLAudioElement;
  private backgroundMusicEnabled: boolean = false;

  constructor() {
    this.clickAudio = new Audio('assets/sound/click.mp3');
    this.backgroundAudio = new Audio('assets/sound/background.mp3');
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = 0.2;
  }

  playClick(): void {
    this.clickAudio.currentTime = 0;
    this.clickAudio.play().catch(error => {
      console.error('Error playing click sound:', error);
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

  // Method to enable background music after user interaction
  enableBackgroundMusic(): void {
    if (!this.backgroundMusicEnabled) {
      this.playBackgroundMusic();
    }
  }
}
