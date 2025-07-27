import { Component, OnInit } from '@angular/core';
import { Card, CARD_TIMER_INITIAL_DISPLAY, CARD_TIMER_LENGTH } from '../card/card';
import { AttackStyle, CardDisplay, CardStats } from '../../util/card-types';
import { randomInteger } from '../../util/card-util';
import { interval, Subscription } from 'rxjs';

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

  coinFlipSub!: Subscription | null;
  coinImageSource: string = 'assets/coin_1.png'
  coinImagePrefix: string = 'assets/coin_'
  coinImageNumber: number = 0;
  coinImageType: string = '.png';

  currentTicks: number = 0;
  totalTicks: number = 100;

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

  flipCoin() {
    setTimeout(() => {
          this.coinFlipSub = interval(50).subscribe(() => {
            this.coinImageNumber = (this.coinImageNumber + 1) % 12;
            if (this.currentTicks++ >= this.totalTicks) {
              this.currentTicks = 0;
              this.coinFlipSub?.unsubscribe();
              this.coinFlipSub = null;
            }
          });
        }, CARD_TIMER_INITIAL_DISPLAY);
  }
}
