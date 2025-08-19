import { AfterViewChecked, AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CARD_TYPES, CardDisplay, CardStats } from '../../util/card-types';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { toLowerCaseWithouSpaces } from '../../util/general-utils';

export const CARD_TIMER_INITIAL_DISPLAY: number = 300; //Time in ms to show first number before starting countdown
export const CARD_TIMER_LENGTH: number = 1500; //Time in ms for timer to expire

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class Card implements OnInit, AfterViewInit, OnChanges, AfterViewChecked {
  
  @Input()
  id: number = 0; //unique number to distinguish from other cards on board, used for CSS styling

  @Input()
  cardType: number = 0; //0 = wolf, 1 = goblin ... 67 = genji, etc.

  @Input()
  cardDisplay: CardDisplay = CardDisplay.FRIEND;

  @Input()
  cardStats!: CardStats;

  @Input()
  isSelected: boolean = false;

  @Input()
  cardText: string = '';

  //Timing Variables
  timerSub!: Subscription | null;

  displayAttackPower: string = '0';
  displayPhysicalDefense: string = '0';
  displayMagicalDefense: string = '0';
  displayAttackStyle: string = 'P';

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
    } else if (changes['cardText'] && changes['cardText'].currentValue) {
      //The card text was updated. It will either be text prompting the
      //user to select a card, or, it will be a timer. In the case that
      //we receive a timer, the text in the card will reflect a number 
      //ticking down
      if (this.cardText.includes('Timer')) {
        //Check to see that there isn't already a timer in place, if not, then
        //start a new one. This check prevents accidentally restarting the timer
        if (!this.timerSub) {
          this.createTimerSubscription();
        } else {
          console.log('couldn\'t start timer');
        }
        
      }
    } else if (changes['cardStats'] && changes['cardStats'].currentValue) {
      //The stats for the card have changed, this happens when selecting cards
      //from the home screen. When this happens we need to dynamically update
      //arrow locations on the card.
      this.makeActiveArrowsVisible();
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
    if (!this.cardStats) {
      //If there aren't any stats then there won't be any arrows to render
      return;
    }

    let cardHTMLElementChildren = document.getElementById('card-' + this.id)?.children?.item(0)?.children;
    let shifter = 1;
    
    for (let i = 0; i < 8; i++) {
      if (shifter & this.cardStats.activeArrows) {
        cardHTMLElementChildren?.item(i)?.classList.add('active');
      } else {
        cardHTMLElementChildren?.item(i)?.classList.remove('active');
      }

      shifter <<= 1;
    }
  }

  calculateDisplayValues() {
    if (this.cardStats !== undefined) {
      this.displayAttackPower = this.findNearestHexNumber(this.cardStats.attackPower);
      this.displayPhysicalDefense = this.findNearestHexNumber(this.cardStats.physicalDefense);
      this.displayMagicalDefense = this.findNearestHexNumber(this.cardStats.magicalDefense);
      this.displayAttackStyle = this.cardStats.attackStyle;
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

  createTimerSubscription() {
    //When a card battle occurs, a number should pop up on the card
    //which indicates its attack or defense. This number should then
    //slowly or quickly tick down towards 0.

    //The timer text sent as input to the card is composed of two 
    //numbers. The first number represents the start value and the 
    //second number represents the end value. The end value is calculated
    //based on logic carried out in the gameplay class.

    //It should always take the same amount of time to tick down from the 
    //start number to the end number, so the larger the difference is,
    //the faster the tick value will be.
    let times = this.cardText.split('Timer: ')[1].split(/\s+/).map(Number);
    this.cardText = String(times[0]);
    const calculatedInterval = Math.round(CARD_TIMER_LENGTH / (times[0] - times[1]));

    //Just to give the user some time to register the fist number,
    //wait for a tiny bit before starting to tick it down
    setTimeout(() => {
      this.timerSub = interval(calculatedInterval).subscribe(() => {
        this.cardText = String(times[0]--);
        if (times[0] <= times[1]) {
          this.cardText = '';
          this.timerSub?.unsubscribe();
          this.timerSub = null;
        }
      });
    }, CARD_TIMER_INITIAL_DISPLAY);
    
  }

  getCardImage():string {
    const cardName = toLowerCaseWithouSpaces(CARD_TYPES[this.cardType].name);
    return 'assets/card_pictures/' + cardName + '.png';
  }

  onImageError(event: Event) {
  (event.target as HTMLImageElement).src = 'assets/card_pictures/empty.png';
}
}
