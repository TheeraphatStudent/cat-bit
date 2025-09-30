import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pixel-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pixel-grid.html',
  styleUrls: ['./pixel-grid.css']
})
export class PixelGrid implements OnInit {
  cols = 0;
  rows = 0;
  pixels: { delay: string }[] = [];

  ngOnInit(): void {
    this.buildGrid();
  }

  @HostListener('window:resize')
  onResize() {
    this.buildGrid();
  }

  buildGrid(): void {
    const pixelSize = 72;
    // this.cols = Math.ceil(window.innerWidth / pixelSize) + 12; // +2 buffer for overflow
    // this.rows = Math.ceil(window.innerHeight / pixelSize) + 8; // +2 buffer for overflow

    this.cols = 44;
    this.rows = 22;

    this.pixels = [];
    const totalPixels = this.cols * this.rows;

    for (let i = 0; i < totalPixels; i++) {
      const row = Math.floor(i / this.cols);
      const delay = row * ( Math.random() * 0.25) + Math.random() * 1.5;

      this.pixels.push({
        delay: `${delay}s`
      });
    }
  }
}
