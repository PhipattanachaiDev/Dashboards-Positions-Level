import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { OrgChartComponent } from './pages/org-chart/org-chart.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  ApartmentOutline, GlobalOutline, UserOutline, CloseOutline,
  PlusOutline, TeamOutline, DragOutline, FormOutline,
  LinkOutline, CloseCircleFill
} from '@ant-design/icons-angular/icons';

const icons = [
  ApartmentOutline, GlobalOutline, UserOutline, CloseOutline,
  PlusOutline, TeamOutline, DragOutline, FormOutline,
  LinkOutline, CloseCircleFill
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OrgChartComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    NzIconModule.forRoot(icons)],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
