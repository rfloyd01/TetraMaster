import { Component, OnInit } from '@angular/core';
import { Card, CARD_TIMER_INITIAL_DISPLAY, CARD_TIMER_LENGTH } from '../card/card';
import { AttackStyle, CardDisplay, CardStats } from '../../util/card-types';
import { randomInteger } from '../../util/card-util';

@Component({
  selector: 'app-test',
  imports: [Card],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test implements OnInit {

  cardDisplay = CardDisplay;
  testTextOne: string = '';
  testTextTwo: string = '';
  cardStats!: CardStats;

  ngOnInit(): void {
    this.cardStats = {
      activeArrows: 0b10101010,
      attackPower: 64,
      attackStyle: AttackStyle.PHYSICAL,
      physicalDefense: 13,
      magicalDefense: 8
    }
  }

  setTimerOne() {
    this.testTextOne = 'Timer: ' + randomInteger(200, 100) + ' ' + randomInteger(50, 0); //first set the timer
    this.testTextTwo = 'Timer: ' + randomInteger(20, 10) + ' ' + randomInteger(9, 0); //first set the timer
    setTimeout(() => {
      this.testTextOne = ''; //Then reset the text, this won't have an effect on the current timer
      this.testTextTwo = ''; //Then reset the text, this won't have an effect on the current timer
    }, CARD_TIMER_LENGTH  + CARD_TIMER_INITIAL_DISPLAY + 5);
  }

  setTimerTwo() {
    this.testTextOne = 'Timer: 250 222'; //first set the timer
    this.testTextTwo = 'Timer: 100 0'; //first set the timer
    setTimeout(() => {
      this.testTextOne = ''; //Then reset the text, this won't have an effect on the current timer
      this.testTextTwo = ''; //Then reset the text, this won't have an effect on the current timer
    }, CARD_TIMER_LENGTH  + CARD_TIMER_INITIAL_DISPLAY + 5);
  }
}
