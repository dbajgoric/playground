import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainModule } from './main/main.module';
import { MainComponent } from './main/main.component';
import { LocationsListComponent } from './main/locations-list.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'locations',
        component: LocationsListComponent
      }
    ]
  }
];

@NgModule({
  imports: [MainModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
