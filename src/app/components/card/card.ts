import { AfterViewChecked, AfterViewInit, Component, effect, Input, OnChanges, OnInit, Signal, SimpleChange, SimpleChanges } from '@angular/core';
import { AttackStyle, CardDisplay, CardStats } from '../../util/card-types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, AfterViewInit, OnChanges, AfterViewChecked {
  
  @Input()
  id: number = 0; //unique number to distinguish from other cards on map

  @Input()
  cardType: number = 0; //0 = wolf, 1 = goblin ... 67 = genji, etc.

  @Input()
  cardDisplay: CardDisplay = CardDisplay.FRIEND;

  // @Input()
  // cardStats!: Signal<CardStats>;

  @Input()
  cardStats!: CardStats;

  @Input()
  isSelected: boolean = false;

  displayAttackPower: string = '0';
  displayPhysicalDefense: string = '0';
  displayMagicalDefense: string = '0';

  displayBack: boolean = false;
  displayStats: boolean = true;
  cardJustPlaced: boolean = false;

  ngOnInit(): void {
    this.calculateDisplayValues();
  }

  ngAfterViewInit(): void {
    this.makeActiveArrowsVisible();
    this.setCardDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isSelected'] !== undefined) {
      let cardHTMLElement = document.getElementById('card-' + this.id);
      if (cardHTMLElement) {
        if (changes['isSelected'].currentValue) {
          this.addCSSClasses(cardHTMLElement, ['selected']);
        } else {
          this.removeCSSClasses(cardHTMLElement, ['selected']);
        }
      }
    }

    this.setCardDisplay(); //Update display after changes have been applied
    this.calculateDisplayValues();
  }

  ngAfterViewChecked(): void {
    if (this.cardJustPlaced) {
      this.cardJustPlaced = false;
      this.makeActiveArrowsVisible();
    }
  }

  makeActiveArrowsVisible() {
    let cardHTMLElementChildren = document.getElementById('card-' + this.id)?.children?.item(0)?.children;
    let shifter = 1;
    
    for (let i = 0; i < 8; i++) {
      if (shifter & this.cardStats.activeArrows) {
        cardHTMLElementChildren?.item(i)?.classList.add('active');
      }

      shifter <<= 1;
    }
  }

  calculateDisplayValues() {
    if (this.cardStats !== undefined) {
      this.displayAttackPower = this.findNearestHexNumber(this.cardStats.attackPower);
      this.displayPhysicalDefense = this.findNearestHexNumber(this.cardStats.physicalDefense);
      this.displayMagicalDefense = this.findNearestHexNumber(this.cardStats.magicalDefense);
    }
    
  }

  setCardDisplay() {
    let cardHTMLElement = document.getElementById('card-' + this.id);

    if (cardHTMLElement) {
      
      //Set component booleans based on new/old Display type
      if (cardHTMLElement.classList.contains(CardDisplay.EMPTY)) {
        this.cardJustPlaced = true;
      }

      //Remove any existing ownership class for the card. If card was previously empty
      //then we need to actively render card's arrows. A boolean flag is used to do this.
      // for (let owner of Object.values(CardDisplay)) {
      //   if (cardHTMLElement.classList.contains(owner)) {
      //     cardHTMLElement.classList.remove(owner);
      //   }
      // }
      this.removeCSSClasses(cardHTMLElement, Object.values(CardDisplay));

      //then add the new class
      cardHTMLElement.classList.add(this.cardDisplay);
    }

    //Finally, disable/enable stats from being shown
    this.displayStats = (this.cardDisplay == CardDisplay.FRIEND || this.cardDisplay == CardDisplay.ENEMY);
    this.displayBack = (this.cardDisplay == CardDisplay.BACK);
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

  addCSSClasses(htmlElement: HTMLElement, cssClasses: string[]) {
    for (let cssClass of cssClasses) {
      htmlElement.classList.add(cssClass);
    }
  }

  removeCSSClasses(htmlElement: HTMLElement, cssClasses: string[]) {
    for (let cssClass of cssClasses) {
      if (htmlElement.classList.contains(cssClass)) {
        htmlElement.classList.remove(cssClass);
      }
    }
  }
}
