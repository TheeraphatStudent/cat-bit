import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appParticleEffect]',
  standalone: true
})
export class ParticleDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    // Create multiple particles for burst effect
    for (let i = 0; i < 8; i++) {
      this.createParticle(event.pageX, event.pageY, i);
    }
  }

  private createParticle(x: number, y: number, index: number): void {
    const particle = this.renderer.createElement('div');
    this.renderer.addClass(particle, 'particle');

    // Random angle for each particle
    const angle = (index * 45) + (Math.random() * 20 - 10);
    const distance = 40 + Math.random() * 40;
    const size = 4 + Math.random() * 4;

    // Set initial position
    this.renderer.setStyle(particle, 'left', `${x}px`);
    this.renderer.setStyle(particle, 'top', `${y}px`);
    this.renderer.setStyle(particle, 'width', `${size}px`);
    this.renderer.setStyle(particle, 'height', `${size}px`);

    // Calculate end position
    const endX = x + Math.cos(angle * Math.PI / 180) * distance;
    const endY = y + Math.sin(angle * Math.PI / 180) * distance;

    this.renderer.setStyle(particle, '--end-x', `${endX}px`);
    this.renderer.setStyle(particle, '--end-y', `${endY}px`);

    this.renderer.appendChild(document.body, particle);

    // Remove particle after animation
    setTimeout(() => {
      this.renderer.removeChild(document.body, particle);
    }, 800);
  }
}
