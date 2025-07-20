import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { AttackStyle } from '../../util/card-types';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, AfterViewInit {
  
  @Input()
  activeArrows: number = 0b11111111; //8 bit number representing the arrows on the card

  @Input()
  id: number = 0; //unique number to distinguish from other cards on map

  @Input()
  attackPower: number = 0;
  
  @Input()
  attackStyle: AttackStyle = AttackStyle.FLEXIBLE;

  @Input()
  physicalDefense: number = 100;

  @Input()
  magicalDefense: number = 21;

  @Input()
  cardType: number = 0; //0 = wolf, 1 = goblin ... 67 = genji, etc.

  displayAttackPower: string = '0';
  displayPhysicalDefense: string = '0';
  displayMagicalDefense: string = '0';

  ngOnInit(): void {
    this.calculateDisplayValues();
  }

  ngAfterViewInit(): void {
    this.makeActiveArrowsVisible();
  }

  makeActiveArrowsVisible() {
    let cardHTMLElementChildren = document.getElementById('card-' + this.id)?.children;
    let shifter = 1;
    for (let i = 0; i < 8; i++) {
      if (shifter & this.activeArrows) {
        cardHTMLElementChildren?.item(i)?.classList.add('active');
      }

      shifter <<= 1;
    }
  }

  calculateDisplayValues() {
    this.displayAttackPower = this.findNearestHexNumber(this.attackPower);
    this.displayPhysicalDefense = this.findNearestHexNumber(this.physicalDefense);
    this.displayMagicalDefense = this.findNearestHexNumber(this.magicalDefense);
  }

  findNearestHexNumber(decimalNumber: number): string {
    if (decimalNumber < 16) {
      return '0';
    } else if (decimalNumber < 32) {
      return '1';
    } else if (decimalNumber < 48) {
      return '2';
    } else if (decimalNumber < 64) {
      return '3';
    } else if (decimalNumber < 80) {
      return '4';
    } else if (decimalNumber < 96) {
      return '5';
    } else if (decimalNumber < 112) {
      return '6';
    } else if (decimalNumber < 128) {
      return '7';
    } else if (decimalNumber < 144) {
      return '8';
    } else if (decimalNumber < 160) {
      return '9';
    } else if (decimalNumber < 176) {
      return 'A';
    } else if (decimalNumber < 192) {
      return 'B';
    } else if (decimalNumber < 208) {
      return 'C';
    } else if (decimalNumber < 224) {
      return 'D';
    } else if (decimalNumber < 240) {
      return 'E';
    } else {
      return 'F';
    }
  }
}
