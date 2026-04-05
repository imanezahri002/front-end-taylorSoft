import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SecurityContext } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface SidebarItem {
  label: string;
  iconSvg?: SafeHtml;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
  @Input() title = 'Tableau de bord';

  sidebarItems: SidebarItem[] = [];

  constructor(
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.sidebarItems = this.getSidebarItems();
  }

  get role(): string | null {
    const storedRole = this.authService.getUserRole();
    if (!storedRole) {
      return null;
    }

    const upperRole = storedRole.trim().toUpperCase();
    const roleWithoutPrefix = upperRole.startsWith('ROLE_')
      ? upperRole.substring(5)
      : upperRole;

    if (roleWithoutPrefix === 'COUTOURIER') {
      return 'COUTURIER';
    }

    return roleWithoutPrefix;
  }

  private getSidebarItems(): SidebarItem[] {
    // Les SVG sont g�n�r�s pour correspondre � votre image
    const vueEnsembleSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>`);
    const usersSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`);
    const colorsSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>`);
    const categoriesSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>`);
    const tissuesSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>`);
    const ordersSvg = this.sanitizer.bypassSecurityTrustHtml(`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`);

    if (this.role === 'ADMIN') {
      return [
        { label: "Vue d'ensemble", route: '/dashboard', iconSvg: vueEnsembleSvg },
        { label: 'Gestion Utilisateurs', route: '/dashboard/users', iconSvg: usersSvg },
        { label: 'Gestion Couleurs', route: '/dashboard/couleurs', iconSvg: colorsSvg },
        { label: 'Gestion Catégories', route: '/dashboard/categories', iconSvg: categoriesSvg },
        { label: 'Gestion Tissus', route: '/dashboard/tissus', iconSvg: tissuesSvg },
        { label: 'Types de Tissu', route: '/dashboard/type-tissus', iconSvg: tissuesSvg }
      ];
    }

    if (this.role === 'COUTURIER') {
      return [
        { label: "Mon Atelier", route: '/dashboard', iconSvg: vueEnsembleSvg },
        { label: 'Gestion Tissus', route: '/dashboard/tissus', iconSvg: tissuesSvg },
        { label: 'Types de Tissu', route: '/dashboard/type-tissus', iconSvg: tissuesSvg },
        { label: 'Commandes Tissu', route: '/dashboard/order-couturier', iconSvg: ordersSvg },
        { label: 'Mes Modèles', route: '/couturier/models', iconSvg: categoriesSvg },
        { label: 'Planning', route: '/dashboard/planning', iconSvg: tissuesSvg }
      ];
    }

    if (this.role === 'CLIENT') {
      return [
        { label: 'Mes Mesures', route: '/client/measurements', iconSvg: usersSvg },
        { label: 'Mes Commandes', route: '/client/dashboard', iconSvg: categoriesSvg },
        { label: 'Mon Profil', route: '/client/profile', iconSvg: usersSvg }
      ];
    }

    return [
      { label: 'Accueil', route: '/dashboard', iconSvg: vueEnsembleSvg }
    ];
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}






