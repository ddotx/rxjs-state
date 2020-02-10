import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {NgxRxStateModule} from "@scope/ngx-rx-state";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxRxStateModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
