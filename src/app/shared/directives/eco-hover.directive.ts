// src/app/shared/directives/eco-hover.directive.ts
import { Directive, ElementRef, HostListener, Input, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appEcoHover]'
})
export class EcoHoverDirective implements OnDestroy {
  @Input() ecoHoverColor: string = '#22c55e';
  @Input() ecoHoverEffect: 'glow' | 'scale' | 'lift' | 'pulse' | 'leaf' | 'wave' = 'glow';
  @Input() ecoHoverIntensity: 'subtle' | 'normal' | 'strong' = 'normal';
  @Input() ecoHoverDuration: number = 300;

  private animationFrame?: number;
  private isAnimating: boolean = false;
  private originalTransform: string = '';
  private originalBoxShadow: string = '';
  private originalBackground: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.setupElement();
  }

  private setupElement() {
    // Guardar estilos originales
    const computedStyle = window.getComputedStyle(this.el.nativeElement);
    this.originalTransform = computedStyle.transform;
    this.originalBoxShadow = computedStyle.boxShadow;
    this.originalBackground = computedStyle.background;

    // Configurar transición
    this.renderer.setStyle(
      this.el.nativeElement,
      'transition',
      `all ${this.ecoHoverDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    );

    // Asegurar que el elemento tenga cursor pointer
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');
  }

  @HostListener('mouseenter') onMouseEnter() {
    if (this.isAnimating) return;
    
    switch (this.ecoHoverEffect) {
      case 'glow':
        this.applyGlowEffect();
        break;
      case 'scale':
        this.applyScaleEffect();
        break;
      case 'lift':
        this.applyLiftEffect();
        break;
      case 'pulse':
        this.applyPulseEffect();
        break;
      case 'leaf':
        this.applyLeafEffect();
        break;
      case 'wave':
        this.applyWaveEffect();
        break;
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.resetStyles();
  }

  private applyGlowEffect() {
    const intensity = this.getIntensityValue();
    const glowSize = 4 + (intensity * 4);
    const glowOpacity = 0.3 + (intensity * 0.2);
    
    const boxShadow = `0 0 ${glowSize}px ${this.ecoHoverColor}${Math.floor(glowOpacity * 255).toString(16)}`;
    
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', boxShadow);
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-2px)');
  }

  private applyScaleEffect() {
    const intensity = this.getIntensityValue();
    const scale = 1 + (0.02 + intensity * 0.03);
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `scale(${scale}) translateY(-2px)`
    );
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      `0 4px 12px rgba(34, 197, 94, ${0.15 + intensity * 0.1})`
    );
  }

  private applyLiftEffect() {
    const intensity = this.getIntensityValue();
    const translateY = -(2 + intensity * 4);
    const shadowBlur = 8 + (intensity * 8);
    const shadowOpacity = 0.1 + (intensity * 0.1);
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `translateY(${translateY}px)`
    );
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      `0 ${Math.abs(translateY * 2)}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`
    );
  }

  private applyPulseEffect() {
    this.isAnimating = true;
    let scale = 1;
    let direction = 1;
    const maxScale = 1 + (this.getIntensityValue() * 0.05);
    const minScale = 1;
    const step = 0.002;

    const pulse = () => {
      scale += direction * step;
      
      if (scale >= maxScale) {
        direction = -1;
      } else if (scale <= minScale) {
        direction = 1;
      }
      
      this.renderer.setStyle(
        this.el.nativeElement,
        'transform',
        `scale(${scale})`
      );
      
      if (this.isAnimating) {
        this.animationFrame = requestAnimationFrame(pulse);
      }
    };
    
    this.animationFrame = requestAnimationFrame(pulse);
  }

  private applyLeafEffect() {
    const intensity = this.getIntensityValue();
    
    // Crear elemento de hoja flotante
    const leaf = this.renderer.createElement('div');
    this.renderer.setStyle(leaf, 'position', 'absolute');
    this.renderer.setStyle(leaf, 'top', '10%');
    this.renderer.setStyle(leaf, 'right', '10%');
    this.renderer.setStyle(leaf, 'width', '12px');
    this.renderer.setStyle(leaf, 'height', '12px');
    this.renderer.setStyle(leaf, 'pointer-events', 'none');
    this.renderer.setStyle(leaf, 'z-index', '10');
    this.renderer.setProperty(leaf, 'innerHTML', '🍃');
    this.renderer.setStyle(leaf, 'animation', `leafFloat ${1 + intensity}s ease-in-out infinite`);
    
    // Asegurar posición relativa en el elemento padre
    const position = window.getComputedStyle(this.el.nativeElement).position;
    if (position === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }
    
    this.renderer.appendChild(this.el.nativeElement, leaf);
    
    // Remover la hoja después de la animación
    setTimeout(() => {
      if (this.el.nativeElement.contains(leaf)) {
        this.renderer.removeChild(this.el.nativeElement, leaf);
      }
    }, (1 + intensity) * 1000);
    
    // Aplicar también un efecto sutil al elemento
    this.renderer.setStyle(
      this.el.nativeElement,
      'background',
      `linear-gradient(45deg, transparent 0%, ${this.ecoHoverColor}10 50%, transparent 100%)`
    );
  }

  private applyWaveEffect() {
    const intensity = this.getIntensityValue();
    
    // Crear elemento de onda
    const wave = this.renderer.createElement('div');
    this.renderer.setStyle(wave, 'position', 'absolute');
    this.renderer.setStyle(wave, 'top', '0');
    this.renderer.setStyle(wave, 'left', '0');
    this.renderer.setStyle(wave, 'right', '0');
    this.renderer.setStyle(wave, 'bottom', '0');
    this.renderer.setStyle(wave, 'border-radius', 'inherit');
    this.renderer.setStyle(wave, 'pointer-events', 'none');
    this.renderer.setStyle(wave, 'overflow', 'hidden');
    this.renderer.setStyle(wave, 'z-index', '1');
    
    const waveInner = this.renderer.createElement('div');
    this.renderer.setStyle(waveInner, 'position', 'absolute');
    this.renderer.setStyle(waveInner, 'top', '0');
    this.renderer.setStyle(waveInner, 'left', '-100%');
    this.renderer.setStyle(waveInner, 'width', '100%');
    this.renderer.setStyle(waveInner, 'height', '100%');
    this.renderer.setStyle(waveInner, 'background', `linear-gradient(90deg, transparent, ${this.ecoHoverColor}20, transparent)`);
    this.renderer.setStyle(waveInner, 'animation', `waveSlide ${0.6 + intensity * 0.4}s ease-out`);
    
    this.renderer.appendChild(wave, waveInner);
    
    // Asegurar posición relativa en el elemento padre
    const position = window.getComputedStyle(this.el.nativeElement).position;
    if (position === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }
    
    this.renderer.appendChild(this.el.nativeElement, wave);
    
    // Remover la onda después de la animación
    setTimeout(() => {
      if (this.el.nativeElement.contains(wave)) {
        this.renderer.removeChild(this.el.nativeElement, wave);
      }
    }, (0.6 + intensity * 0.4) * 1000);
  }

  private getIntensityValue(): number {
    switch (this.ecoHoverIntensity) {
      case 'subtle':
        return 0.3;
      case 'strong':
        return 1;
      default:
        return 0.6;
    }
  }

  private resetStyles() {
    this.isAnimating = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    
    // Restaurar estilos originales
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      this.originalTransform !== 'none' ? this.originalTransform : ''
    );
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      this.originalBoxShadow !== 'none' ? this.originalBoxShadow : ''
    );
    
    this.renderer.setStyle(
      this.el.nativeElement,
      'background',
      this.originalBackground
    );
  }

  ngOnDestroy() {
    this.isAnimating = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

/**
 * EJEMPLOS DE USO:
 * 
 * <!-- Efecto de brillo básico -->
 * <button appEcoHover>Hover me!</button>
 * 
 * <!-- Efecto de escala con color personalizado -->
 * <div appEcoHover 
 *      ecoHoverEffect="scale" 
 *      ecoHoverColor="#3b82f6">Card</div>
 * 
 * <!-- Efecto de hoja con intensidad fuerte -->
 * <div appEcoHover 
 *      ecoHoverEffect="leaf" 
 *      ecoHoverIntensity="strong">Eco Button</div>
 * 
 * <!-- Efecto de onda con duración personalizada -->
 * <div appEcoHover 
 *      ecoHoverEffect="wave" 
 *      ecoHoverDuration="500">Wave Effect</div>
 * 
 * <!-- Efecto de pulso sutil -->
 * <div appEcoHover 
 *      ecoHoverEffect="pulse" 
 *      ecoHoverIntensity="subtle">Pulse Effect</div>
 */