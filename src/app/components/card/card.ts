import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AttackStyle, CardOwner } from '../../util/card-types';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, AfterViewInit, OnChanges {
  
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

  @Input()
  cardOwner: CardOwner = CardOwner.FRIEND;

  displayAttackPower: string = '0';
  displayPhysicalDefense: string = '0';
  displayMagicalDefense: string = '0';

  ngOnInit(): void {
    this.calculateDisplayValues();
  }

  ngAfterViewInit(): void {
    this.makeActiveArrowsVisible();
    this.setCardOwner();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cardOwner']) {
      this.setCardOwner();
    }
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

  setCardOwner() {
    let cardHTMLElement = document.getElementById('card-' + this.id);

    if (cardHTMLElement) {
      //Remove any existing ownership class for the card
      if (cardHTMLElement.classList.contains(CardOwner.FRIEND)) {
        cardHTMLElement.classList.remove(CardOwner.FRIEND);
      } else if (cardHTMLElement.classList.contains(CardOwner.ENEMY)) {
        cardHTMLElement.classList.remove(CardOwner.ENEMY);
      }

      //then add the new class
      cardHTMLElement.classList.add(this.cardOwner);
    }
    
  }

  findNearestHexNumber(decimalNumber: number): string {
    //Takes the input base 10 number and converts it to the nearest (rounded down)
    //hexadecimal number, returning this hex number as a string. For example, an 
    //input of 123 would return the hex decimal '7'. Any input outside the range of 
    //0-255 will be rounded to either the '0' digit of 'F' digit.
    if (decimalNumber < 16) {
      return '0';
    } else if (decimalNumber > 255) {
      return 'F';
    }
    
    const baseSixteenNumber = Math.floor(decimalNumber / 16);

    if (baseSixteenNumber >= 10) {
      return String.fromCharCode('A'.charCodeAt(0) + (baseSixteenNumber - 10));
    }

    return String(baseSixteenNumber);
  }
}
