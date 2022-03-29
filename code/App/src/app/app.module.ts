import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DataViz1Component } from './data-viz1/data-viz1.component';
import { DataViz2Component } from './data-viz2/data-viz2.component';
import { DataViz3Component } from './data-viz3/data-viz3.component';
import { DataViz4Component } from './data-viz4/data-viz4.component';

@NgModule({
  declarations: [
    AppComponent,
    DataViz1Component,
    DataViz2Component,
    DataViz3Component,
    DataViz4Component
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
