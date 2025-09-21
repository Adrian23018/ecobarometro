import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MenubarModule } from 'primeng/menubar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SplitButtonModule } from 'primeng/splitbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { FieldsetModule } from 'primeng/fieldset';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { DragDropModule } from 'primeng/dragdrop';
import { OrderListModule } from 'primeng/orderlist';
import { KnobModule } from 'primeng/knob';
import { RatingModule } from 'primeng/rating';

// Routing
import { AdminRoutingModule } from './admin-routing.module';

// Shared Components

// Services
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    // Los componentes standalone se cargan dinámicamente
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AdminRoutingModule,
    DecimalPipe,
    
    // PrimeNG Modules
    ButtonModule,
    CardModule,
    TableModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    MenubarModule,
    PanelMenuModule,
    ChartModule,
    ProgressBarModule,
    BadgeModule,
    AvatarModule,
    MenuModule,
    SplitButtonModule,
    InputNumberModule,
    ColorPickerModule,
    MultiSelectModule,
    CalendarModule,
    SliderModule,
    ToggleButtonModule,
    SelectButtonModule,
    RadioButtonModule,
    CheckboxModule,
    PaginatorModule,
    TabViewModule,
    AccordionModule,
    FieldsetModule,
    DividerModule,
    TagModule,
    ChipModule,
    SkeletonModule,
    OverlayPanelModule,
    TooltipModule,
    RippleModule,
    StyleClassModule,
    FileUploadModule,
    ImageModule,
    DragDropModule,
    OrderListModule,
    KnobModule,
    RatingModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  exports:[DecimalPipe]
})
export class AdminModule { }