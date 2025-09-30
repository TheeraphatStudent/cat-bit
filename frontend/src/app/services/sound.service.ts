import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private clickAudio: HTMLAudioElement;
  private backgroundAudio: HTMLAudioElement;

  constructor() {
    this.clickAudio = new Audio('assets/sound/click.mp3');
    this.backgroundAudio = new Audio('assets/sound/background.mp3');
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = 0.2;
    this.playBackgroundMusic();
  }

  playClick(): void {
    this.clickAudio.currentTime = 0;
    this.clickAudio.play().catch(error => {
      console.error('Error playing click sound:', error);
    });
  }

  playBackgroundMusic(): void {
    this.backgroundAudio.play().catch(error => {
      console.error('Error playing background music:', error);
    });
  }

  pauseBackgroundMusic(): void {
    this.backgroundAudio.pause();
  }

  setBackgroundVolume(volume: number): void {
    this.backgroundAudio.volume = Math.max(0, Math.min(1, volume));
  }
}
