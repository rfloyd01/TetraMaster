import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Card } from './components/card/card';
import { Test} from './components/test/test';
import { GameBoard } from './components/game-board/game-board';
import { TestGameboardComponent } from './components/test-gameboard-component/test-gameboard-component';

export const routes: Routes = [
    {path: '', component:Home},
    {path: 'game', component:GameBoard},
    {path: 'card', component:Card},
    {path: 'test', component:Test},
    {path: 'testBoard', component:TestGameboardComponent}
];
