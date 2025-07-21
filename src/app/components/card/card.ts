import { AfterViewChecked, AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AttackStyle, CardOwner } from '../../util/card-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, AfterViewInit, OnChanges, AfterViewChecked {
  
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

  displayStats: boolean = true;
  cardJustPlaced: boolean = false;

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

    this.setCardOwner();
  }

  ngAfterViewChecked(): void {
    if (this.cardJustPlaced) {
      console.log('Adding arrows...');
      this.cardJustPlaced = false;
      this.makeActiveArrowsVisible();
    }
  }

  makeActiveArrowsVisible() {
    let cardHTMLElementChildren = document.getElementById('card-' + this.id)?.children?.item(0)?.children;
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
      //Remove any existing ownership class for the card. If card was previously empty
      //then we need to actively render card's arrows. A boolean flag is used to do this.
      if (cardHTMLElement.classList.contains(CardOwner.EMPTY)) {
        this.cardJustPlaced = true;
      }

      for (let owner of Object.values(CardOwner)) {
        if (cardHTMLElement.classList.contains(owner)) {
          cardHTMLElement.classList.remove(owner);
        }
      }

      //then add the new class
      cardHTMLElement.classList.add(this.cardOwner);
    }

    //Finally, disable/enable stats from being shown
    this.displayStats = (this.cardOwner == CardOwner.FRIEND || this.cardOwner == CardOwner.ENEMY);
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
