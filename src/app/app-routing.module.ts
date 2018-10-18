import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { TableComponent } from './table/table.component';
import { SummaryComponent } from './summary/summary.component';
import { HistoryComponent } from './history/history.component';

export const routes: Routes = [
  { path: '', redirectTo: 'package_dashboard', pathMatch: 'full' },
  {
    path: 'package_dashboard',
    children: [
      {
        path: 'summary/:context',
        component: SummaryComponent
      },
      {
        path: 'history/:context',
        component: HistoryComponent,
      },
      {
        path: 'table/:context',
        component: TableComponent
      }
    ]
  },
  /* { path: 'summary/:context', component: SummaryComponent },
  { path: 'history/:context', component: HistoryComponent },
  { path: 'table/:context', component: TableComponent } */

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
