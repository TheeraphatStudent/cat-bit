import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert, PixelAlertService } from '../../services/pixel-alert.service';

@Component({
  selector: 'app-pixel-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pixel-alert.component.html',
  styleUrls: ['./pixel-alert.component.css']
})
export class PixelAlertComponent {
  alerts: Alert[] = [];

  constructor(private alertService: PixelAlertService) {
    this.alertService.alerts$.subscribe((alerts: Alert[]) => {
      this.alerts = alerts;
    });
  }

  removeAlert(id: string): void {
    this.alertService.remove(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M20 6 9 17l-5-5';
      case 'error':
        return 'M18 6 6 18M6 6l12 12';
      case 'warning':
        return 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01';
      case 'info':
      default:
        return 'M12 16v-4M12 8h.01';
    }
  }
}
