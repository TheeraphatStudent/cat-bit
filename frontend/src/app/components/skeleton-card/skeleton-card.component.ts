import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-card.component.html',
  styleUrls: ['./skeleton-card.component.css']
})
export class SkeletonCardComponent {
  @Input() type: 'game' | 'coupon' = 'game';
  @Input() count: number = 6;

  get skeletonArray(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
