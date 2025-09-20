// src/app/shared/shared-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// El módulo compartido generalmente no tiene rutas propias,
// pero se incluye para consistencia y posibles rutas futuras
const routes: Routes = [
  // Rutas compartidas (si las hubiera)
  // Ejemplo: páginas de error, páginas de ayuda, etc.
  // {
  //   path: 'help',
  //   component: HelpComponent
  // },
  // {
  //   path: 'error',
  //   component: ErrorPageComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SharedRoutingModule { }

/**
 * Shared Routing Module
 * 
 * Este módulo está preparado para manejar rutas compartidas
 * que puedan ser necesarias en el futuro, como:
 * 
 * - Páginas de error (404, 500, etc.)
 * - Páginas de ayuda
 * - Páginas de términos y condiciones
 * - Páginas de política de privacidad
 * - Páginas de contacto
 * - Páginas de sobre nosotros
 * 
 * Por ahora está vacío ya que los componentes compartidos
 * no requieren rutas específicas.
 */