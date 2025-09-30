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
  pixels: { delay: string; color: string }[] = [];

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
    this.rows = 26;

    this.pixels = [];
    const totalPixels = this.cols * this.rows;

    const primaryColors = [
      'rgba(200, 149, 21, 0.7)',    // #c89515
      'rgba(249, 195, 62, 0.7)',    // #f9c33e
      'rgba(255, 226, 154, 0.65)',  // #ffe29a
      'rgba(206, 166, 73, 0.7)',    // golden
      'rgba(152, 120, 43, 0.75)',   // darker golden
      'rgba(230, 180, 50, 0.7)',    // bright golden
    ];

    const secondaryColors = [
      'rgba(41, 23, 79, 0.75)',     // #29174f
      'rgba(44, 9, 119, 0.8)',      // #2c0977
      'rgba(75, 35, 161, 0.7)',     // #4b23a1
      'rgba(60, 20, 100, 0.75)',    // mid purple
      'rgba(90, 40, 140, 0.7)',     // lighter purple
      'rgba(55, 25, 95, 0.75)',     // deep purple
    ];

    const gradientColors = [
      'linear-gradient(135deg, rgba(44, 9, 119, 0.7), rgba(249, 195, 62, 0.7))',
      'linear-gradient(45deg, rgba(200, 149, 21, 0.7), rgba(75, 35, 161, 0.7))',
      'linear-gradient(90deg, rgba(41, 23, 79, 0.7), rgba(255, 226, 154, 0.65))',
    ];

    const allColors = [...primaryColors, ...secondaryColors, ...primaryColors, ...secondaryColors, ...gradientColors];

    for (let i = 0; i < totalPixels; i++) {
      const row = Math.floor(i / this.cols);
      const delay = row * (0.4) + Math.random() * 1.5;
      
      const randomColor = allColors[Math.floor(Math.random() * allColors.length)];

      this.pixels.push({
        delay: `${delay}s`,
        color: randomColor
      });
    }
  }
}
