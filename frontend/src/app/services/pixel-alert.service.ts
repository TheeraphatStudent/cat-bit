import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PixelAlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();
  private alerts: Alert[] = [];

  constructor() {}

  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    this.alertsSubject.next([...this.alerts]);

    // Auto remove after duration
    if (alert.duration !== 0) {
      setTimeout(() => {
        this.remove(alert.id);
      }, alert.duration || 5000);
    }
  }

  success(message: string, title?: string, duration?: number): void {
    this.addAlert({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(message: string, title?: string, duration?: number): void {
    this.addAlert({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration
    });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.addAlert({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(message: string, title?: string, duration?: number): void {
    this.addAlert({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration
    });
  }

  remove(id: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.alertsSubject.next([...this.alerts]);
  }

  clear(): void {
    this.alerts = [];
    this.alertsSubject.next([]);
  }
}
