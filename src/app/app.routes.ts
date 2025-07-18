import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Card } from './components/card/card';

export const routes: Routes = [
    {path: '', component:Home},
    {path: 'card', component:Card}
];
