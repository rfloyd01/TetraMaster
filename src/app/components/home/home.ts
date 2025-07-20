import { Component } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle } from '../../util/card-types';

@Component({
  selector: 'app-home',
  imports: [Card],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  attackStyle = AttackStyle
}
