import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { GameRoutingModule } from './game-routing.module';
import { QuestionCardComponent } from './question-card/question-card.component';


@NgModule({
  declarations: [QuestionCardComponent],
  imports: [
    CommonModule,
    GameRoutingModule,
    DecimalPipe
  ],
  exports: [QuestionCardComponent]
})
export class GameModule { }
