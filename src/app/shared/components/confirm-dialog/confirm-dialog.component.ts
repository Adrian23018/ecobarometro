// src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
import { Component, Input, Output, EventEmitter, OnInit, ContentChild, TemplateRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  icon?: string;
  showIcon?: boolean;
  allowEscapeKey?: boolean;
  allowClickOutside?: boolean;
  width?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
  animations: [
    trigger('dialogAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'scale(0.8) translateY(-20px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('hidden => visible', animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
      transition('visible => hidden', animate('200ms ease-in'))
    ]),
    trigger('overlayAnimation', [
      state('hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('hidden => visible', animate('200ms ease-out')),
      transition('visible => hidden', animate('150ms ease-in'))
    ]),
    trigger('buttonPress', [
      transition('* => pressed', [
        animate('100ms ease-in', style({ transform: 'scale(0.95)' })),
        animate('100ms ease-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ConfirmDialogComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() config: ConfirmDialogConfig = {
    title: 'Confirmar',
    message: '¿Estás seguro?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'info',
    showIcon: true,
    allowEscapeKey: true,
    allowClickOutside: true,
    width: 'auto'
  };

  @ContentChild(TemplateRef) projectedContent!: TemplateRef<any>;


  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  animationState: string = 'hidden';
  overlayState: string = 'hidden';
  confirmButtonState: string = '';
  cancelButtonState: string = '';

  ngOnInit() {
    this.updateAnimationStates();
  }

  ngOnChanges() {
    this.updateAnimationStates();
  }

  private updateAnimationStates() {
    if (this.visible) {
      this.overlayState = 'visible';
      setTimeout(() => {
        this.animationState = 'visible';
      }, 50);
    } else {
      this.animationState = 'hidden';
      setTimeout(() => {
        this.overlayState = 'hidden';
      }, 200);
    }
  }

  onConfirm() {
    this.confirmButtonState = 'pressed';
    setTimeout(() => {
      this.confirmButtonState = '';
      this.confirmed.emit();
      this.close();
    }, 200);
  }

  onCancel() {
    this.cancelButtonState = 'pressed';
    setTimeout(() => {
      this.cancelButtonState = '';
      this.cancelled.emit();
      this.close();
    }, 200);
  }

  onOverlayClick() {
    if (this.config.allowClickOutside) {
      this.onCancel();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.config.allowEscapeKey) {
      this.onCancel();
    }
    
    if (event.key === 'Enter') {
      this.onConfirm();
    }
  }

  private close() {
    this.visible = false;
    this.updateAnimationStates();
    this.closed.emit();
  }

  get dialogClasses(): string {
    const classes = ['confirm-dialog'];
    
    if (this.config.type) {
      classes.push(`type-${this.config.type}`);
    }
    
    return classes.join(' ');
  }

  get iconConfig() {
    const defaultIcons = {
      info: { icon: 'pi-info-circle', color: '#3b82f6', bgColor: '#dbeafe' },
      warning: { icon: 'pi-exclamation-triangle', color: '#f59e0b', bgColor: '#fef3c7' },
      danger: { icon: 'pi-times-circle', color: '#ef4444', bgColor: '#fecaca' },
      success: { icon: 'pi-check-circle', color: '#22c55e', bgColor: '#dcfce7' }
    };

    const typeConfig = defaultIcons[this.config.type || 'info'];
    
    return {
      icon: this.config.icon || typeConfig.icon,
      color: typeConfig.color,
      bgColor: typeConfig.bgColor
    };
  }

  get confirmButtonClasses(): string {
    const baseClasses = 'confirm-btn px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (this.config.confirmButtonClass) {
      return `${baseClasses} ${this.config.confirmButtonClass}`;
    }

    const typeClasses = {
      info: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
    };

    return `${baseClasses} ${typeClasses[this.config.type || 'info']}`;
  }

  get cancelButtonClasses(): string {
    const baseClasses = 'cancel-btn px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (this.config.cancelButtonClass) {
      return `${baseClasses} ${this.config.cancelButtonClass}`;
    }

    return `${baseClasses} bg-gray-300 hover:bg-gray-400 text-gray-700 focus:ring-gray-500`;
  }

  get dialogWidth(): string {
    return this.config.width || 'auto';
  }

  
  get hasBodyContent(): boolean {
    return !!this.projectedContent;
  }
}