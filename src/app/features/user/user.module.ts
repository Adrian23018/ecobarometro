import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { KnobModule } from 'primeng/knob';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TimelineModule } from 'primeng/timeline';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { DataViewModule } from 'primeng/dataview';
import { GalleriaModule } from 'primeng/galleria';
import { CarouselModule } from 'primeng/carousel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SplitterModule } from 'primeng/splitter';
import { FieldsetModule } from 'primeng/fieldset';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';

// Routing
import { UserRoutingModule } from './user-routing.module';

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
    UserRoutingModule,
    
    // PrimeNG Modules
    ButtonModule,
    CardModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    ChartModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    CalendarModule,
    FileUploadModule,
    ImageModule,
    KnobModule,
    ProgressSpinnerModule,
    TimelineModule,
    RatingModule,
    DividerModule,
    PanelModule,
    OverlayPanelModule,
    TooltipModule,
    RippleModule,
    SkeletonModule,
    MessagesModule,
    MessageModule,
    AccordionModule,
    TabViewModule,
    DataViewModule,
    GalleriaModule,
    CarouselModule,
    ScrollPanelModule,
    SplitterModule,
    FieldsetModule,
    ToggleButtonModule,
    SelectButtonModule,
    MultiSelectModule,
    CheckboxModule,
    RadioButtonModule,
    SliderModule,
    InputNumberModule,
    PasswordModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ]
})
export class UserModule { }