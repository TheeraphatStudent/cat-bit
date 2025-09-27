import { Injectable } from '@angular/core';

export interface DesignToken {
  type: string;
  value: any;
  description?: string;
}

export interface ColorToken extends DesignToken {
  type: 'color';
  value: string;
  blendMode?: string;
}

export interface GradientToken extends DesignToken {
  type: 'custom-gradient';
  value: {
    gradientType: 'linear' | 'radial';
    rotation?: number;
    stops: Array<{
      position: number;
      color: string;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DesignTokenService {
  private tokens: any = {};

  constructor() {
    this.loadTokens();
  }

  private async loadTokens(): Promise<void> {
    try {
      const response = await fetch('/styles/design-tokens.tokens.json');
      this.tokens = await response.json();
    } catch (error) {
      console.warn('Could not load design tokens:', error);
    }
  }

  getToken(path: string): any {
    return this.getNestedValue(this.tokens, path);
  }

  getColorValue(path: string): string {
    const token = this.getToken(path);
    return token?.value || '';
  }

  getGradientCSS(path: string): string {
    const token = this.getToken(path) as GradientToken;
    if (!token || token.type !== 'custom-gradient') {
      return '';
    }

    const { gradientType, rotation = 0, stops } = token.value;
    const stopStrings = stops.map(stop => `${stop.color} ${stop.position * 100}%`);
    
    if (gradientType === 'linear') {
      return `linear-gradient(${rotation}deg, ${stopStrings.join(', ')})`;
    } else if (gradientType === 'radial') {
      return `radial-gradient(${stopStrings.join(', ')})`;
    }
    
    return '';
  }

  getAllColors(): Record<string, string> {
    const colors: Record<string, string> = {};
    this.extractColors(this.tokens, '', colors);
    return colors;
  }

  getAllGradients(): Record<string, string> {
    const gradients: Record<string, string> = {};
    this.extractGradients(this.tokens, '', gradients);
    return gradients;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private extractColors(obj: any, prefix: string, result: Record<string, string>): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object') {
        if ((value as any).type === 'color') {
          result[currentPath] = (value as ColorToken).value;
        } else {
          this.extractColors(value, currentPath, result);
        }
      }
    }
  }

  private extractGradients(obj: any, prefix: string, result: Record<string, string>): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object') {
        if ((value as any).type === 'custom-gradient') {
          result[currentPath] = this.getGradientCSS(currentPath);
        } else {
          this.extractGradients(value, currentPath, result);
        }
      }
    }
  }

  // Utility methods for common design token operations
  applyTheme(element: HTMLElement, theme: 'light' | 'dark' = 'light'): void {
    if (theme === 'dark') {
      element.classList.add('dark-theme');
    } else {
      element.classList.remove('dark-theme');
    }
  }

  generateCSSVariables(): string {
    const colors = this.getAllColors();
    const gradients = this.getAllGradients();
    
    let css = ':root {\n';
    
    // Add color variables
    Object.entries(colors).forEach(([path, value]) => {
      const cssVar = `--${path.replace(/\./g, '-')}`;
      css += `  ${cssVar}: ${value};\n`;
    });
    
    // Add gradient variables
    Object.entries(gradients).forEach(([path, value]) => {
      const cssVar = `--gradient-${path.replace(/\./g, '-')}`;
      css += `  ${cssVar}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }
}