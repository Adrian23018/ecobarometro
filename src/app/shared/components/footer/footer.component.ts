// src/app/shared/components/footer/footer.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() variant: 'default' | 'minimal' | 'detailed' = 'default';
  @Input() showSocialLinks: boolean = true;
  @Input() showAppInfo: boolean = true;
  @Input() showQuickLinks: boolean = true;
  @Input() backgroundColor: string = 'bg-gray-800';
  @Input() textColor: string = 'text-gray-300';

  currentYear = new Date().getFullYear();
  appVersion = '1.0.0';

  socialLinks = [
    { 
      name: 'GitHub', 
      icon: 'pi-github', 
      url: 'https://github.com/ecobarometro',
      color: '#333'
    },
    { 
      name: 'Twitter', 
      icon: 'pi-twitter', 
      url: 'https://twitter.com/ecobarometro',
      color: '#1da1f2'
    },
    { 
      name: 'LinkedIn', 
      icon: 'pi-linkedin', 
      url: 'https://linkedin.com/company/ecobarometro',
      color: '#0077b5'
    },
    { 
      name: 'Instagram', 
      icon: 'pi-instagram', 
      url: 'https://instagram.com/ecobarometro',
      color: '#e4405f'
    }
  ];

  quickLinks = [
    { 
      name: 'Sobre Nosotros', 
      route: '/about',
      external: false
    },
    { 
      name: 'Términos de Uso', 
      route: '/terms',
      external: false
    },
    { 
      name: 'Política de Privacidad', 
      route: '/privacy',
      external: false
    },
    { 
      name: 'Contacto', 
      route: '/contact',
      external: false
    },
    { 
      name: 'Centro de Ayuda', 
      route: '/help',
      external: false
    },
    { 
      name: 'API Docs', 
      route: 'https://docs.ecobarometro.com',
      external: true
    }
  ];

  ecoFeatures = [
    {
      icon: 'pi pi-leaf',
      title: 'Educación Ambiental',
      description: 'Aprende sobre sostenibilidad de forma divertida'
    },
    {
      icon: 'pi pi-trophy',
      title: 'Gamificación',
      description: 'Compite y sube de nivel mientras aprendes'
    },
    {
      icon: 'pi pi-chart-bar',
      title: 'Métricas Reales',
      description: 'Trackea tu progreso en conciencia ecológica'
    },
    {
      icon: 'pi pi-users',
      title: 'Comunidad',
      description: 'Únete a miles de eco-guerreros'
    }
  ];

  onSocialLinkClick(link: any) {
    window.open(link.url, '_blank');
  }

  onQuickLinkClick(link: any) {
    if (link.external) {
      window.open(link.route, '_blank');
    } else {
      // Navegar internamente
      console.log('Navigate to:', link.route);
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
