// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'EcoBarómetro - Juego Ecológico';

  constructor(private primengConfig: PrimeNGConfig) {}

  ngOnInit() {
    // Configuración de PrimeNG
    this.primengConfig.ripple = true;
    
    // Configuración de idioma español para PrimeNG
    this.primengConfig.setTranslation({
      accept: 'Aceptar',
      reject: 'Cancelar',
      choose: 'Elegir',
      upload: 'Subir',
      cancel: 'Cancelar',
      clear: 'Limpiar',
      completed: 'Completado',
      pending: 'Pendiente',
      dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      today: 'Hoy',
      weekHeader: 'Sem',
      weak: 'Débil',
      medium: 'Medio',
      strong: 'Fuerte',
      passwordPrompt: 'Ingrese una contraseña',
      emptyMessage: 'No se encontraron resultados',
      emptyFilterMessage: 'No se encontraron resultados para el filtro'
    });
  }
}