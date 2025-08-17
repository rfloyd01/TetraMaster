import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CARD_TYPES, CardDisplay, CardInfo } from '../../util/card-types';
import { Card } from '../card/card';
import { createRandomStatsForCardType, randomInteger } from '../../util/card-util';
import { CommonModule } from '@angular/common';
import { counter } from '../../util/general-utils';
import { Gameplay } from '../../services/gameplay';
import { LoginSignup } from '../login-signup/login-signup';
import { UserService } from '../../services/user-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule, LoginSignup],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  allCards: CardInfo[][][] = [];
  //TODO: type is now included in card info interface
  selectedCards: {info: CardInfo, type: number}[] = []; //selected cards appear on right side of screen, these will be used in the game 

  totalCardCount: number = 0;
  uniqueCardCount: number = 0;

  //Login variables
  displayLoginModal: boolean = false;
  loginSubscription!: Subscription | null;

  //Fields for Highlighted cards. The highlighted cards appear in the middle of the screen when
  //the player clicks on a grid square. If there are multiple of a single type of card owned then
  //these cards can be shuffled through.
  highlightedCards: CardInfo[] = []; //highlighted cards will appear in center of screen, show clards of currently highlighted grid square
  highlightedCardType!: number | null;
  highlightedCardTypeName!: string | null;
  highlightedCardsHTML!: (HTMLElement | null);

  //Imports
  ALL_CARD_TYPES = CARD_TYPES;
  cardDisplay = CardDisplay;
  counter = counter;

  constructor(private readonly router: Router, private readonly gameService: Gameplay,
    private readonly userService: UserService) {

  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.shuffleHighlightedCards(event.key);
  }

  ngOnInit(): void {
    //Create default grid while user login logic is occuring
    this.setDefaultGrid();

    //Subscribe to the user service which alerts the home screen to user logins
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    this.loginSubscription = this.userService.loginResult.subscribe(
      (res) => {
        if (res == 1) {
          const userCards = this.userService.getUserCards();
          if (userCards) {
            this.allCards = JSON.parse(JSON.stringify(userCards)); //make a deep copy of the cards to prevent accidentally overwriting anything
            this.displayLoginModal = false;
          }
          
        } else if (res == 0) {
          this.setDefaultGrid();
          this.displayLoginModal = true;
        }
      }
    )

    //Attempt to load cards for the currently logged in user. If no user is
    //currently logged in then nothing will happen here.
    console.log('Attempting to load user cards');
    this.userService.loadUserCards();
  }

  startNewGame() {
    this.gameService.setPlayerCards(this.selectedCards.map(e => e.info));
    this.gameService.setNewOpponent({skillLevel: 1, cardLevel: 0}); //TODO: Player should be able to pick opponent, set manually for now
    this.router.navigate(['/game']);
  }

  logout() {
    //logs out the current user
    this.userService.logout();
  }

  setDefaultGrid() {
    this.allCards = [];
    for (let i:number = 0; i < 10; i++) {
      this.allCards.push([]);
      for (let j:number = 0; j < 10; j++) {
        this.allCards[i].push([]);
      }
    }
  }

  loadRandomPlayerCards() {
    //This method can be used for testing.
    this.totalCardCount = 0;
    this.uniqueCardCount = 0;

    //Randomly assign 100 cards into the grid
    for (let i:number = 0; i < 100; i++) {
      const row = randomInteger(10);
      const col = randomInteger(10);

      this.totalCardCount++;
      if (this.allCards[row][col].length == 0) {
        this.uniqueCardCount++;
      }

      this.allCards[row][col].push({
        compositeId: {
          boardLocation: 0,
          uniqueId: randomInteger(1000000), //possible for collision but that's ok for random cards
          userSlot: 0,
          cardTypeId: 10 * col + row
        },
        cardStats: createRandomStatsForCardType(this.ALL_CARD_TYPES[10 * col + row]), //need to transpose row and column to match grid
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      })
    }
  }

  highlightGridCard(row: number, col: number) {
    if (this.allCards[row][col].length > 0) {
      this.highlightedCardType = 10 * col + row; //grid number starts in top left and goes down
      this.highlightedCardTypeName = this.ALL_CARD_TYPES[this.highlightedCardType].name;

      if (this.allCards[row][col]) {
        this.highlightedCards = this.allCards[row][col];
      }

      //Apply the selected CSS class to the grid card in question, and remove it from
      //any existing selected grid card
      if (this.highlightedCardsHTML) {
        this.highlightedCardsHTML.classList.remove('selected');
      }

      this.highlightedCardsHTML = document.getElementById('grid-card-' + (10 * row + col)); //transpose row and col to get correct html element
      if (this.highlightedCardsHTML) {
        this.highlightedCardsHTML.classList.add('selected');
      }
    }
  }

  selectHighlightedCard(index: number) {
    //When a player clicks on the top card in the highlighted cards array
    //it will move the card into the selected cards portion of the screen.
    if (this.selectedCards.length >= 5) {
      return; //can't select more than 5 cards
    }

    if (index == 0) {
      this.selectedCards.push({
        info: {
          compositeId: {
            boardLocation: 0,
            uniqueId: this.highlightedCards[0].compositeId.uniqueId,
            userSlot: this.selectedCards.length,
            cardTypeId: this.highlightedCards[0].compositeId.cardTypeId
          },
          cardStats: this.highlightedCards[0].cardStats,
          isSelected: false,
          cardDisplay: CardDisplay.FRIEND,
          cardText: ''
        },
        type: this.highlightedCards[0].compositeId.cardTypeId
      })

      //The selected card needs to be removed from the grid, and the highlighted
      //cards array.
      const row = this.highlightedCards[0].compositeId.cardTypeId % 10;
      const col = Math.floor(this.highlightedCards[0].compositeId.cardTypeId / 10);
      
      this.highlightedCards = this.highlightedCards.length > 1 ? this.highlightedCards.slice(1) : [];
      this.allCards[row][col] = this.highlightedCards;

      //If there are no more of the given card type then the text in the highlighted
      //card section needs to be hidden (contains card number and name) and the image
      //for the given card in the grid needs to change to the empty slot.
      if (this.highlightedCards.length == 0) {
        this.updateBoardPieceImage(row, col);
        if (this.highlightedCardsHTML != null) {
          this.highlightedCardsHTML.classList.remove('selected');
          this.highlightedCardsHTML = null;
          this.highlightedCardType = null;
          this.highlightedCardTypeName = null;
        }
      }
    }
  }

  shuffleHighlightedCards(key: string) {
    //If there are multiple cards currently in the highlighted cards array
    //then this method is used to move different cards to the front so that
    //they can be selected.
    if (this.highlightedCards.length > 1) {
      let poppedCards: CardInfo[] = [];
      if (key == 'ArrowLeft') {
        //Move the card at the front of the highlighted cards array to the back
        poppedCards = this.highlightedCards.splice(0, 1);
      } else if (key == 'ArrowRight') {
        //Move the card at the back of the highlighted cards array to the front
        poppedCards = this.highlightedCards.splice(0, this.highlightedCards.length - 1);
      } 

      for (let card of poppedCards) {
        this.highlightedCards.push(card);
      }
    }
  }

  removeSelectedCard(index: number) {
    //removes the selected card from the player's hand and puts
    //it back into the grid and highlighted cards (if necessary).
    const type = this.selectedCards[index].type;
    const col = Math.floor(type / 10);
    const row = type % 10;
    this.allCards[row][col].push({
        compositeId: {
          boardLocation: 0,
          uniqueId: this.selectedCards[index].info.compositeId.uniqueId,
          userSlot: 0,
          cardTypeId: this.selectedCards[index].info.compositeId.cardTypeId
        },
        cardStats: this.selectedCards[index].info.cardStats,
        isSelected: false,
        cardDisplay: CardDisplay.FRIEND,
        cardText: ''
      }
    );

    if ((this.highlightedCards.length) > 0 && (this.highlightedCards[0].compositeId.cardTypeId == type)) {
      this.highlightedCards = this.allCards[row][col];
    }

    this.selectedCards.splice(index, 1);
  }

  getBoardPieceImage(row: number, col: number) {
    if (this.allCards[row][col].length == 0) {
      return 'assets/empty_board_piece.png';
    }

    const multi_string = this.allCards[row][col].length > 1 ? 'multi_' : '';
    const index = (10 * col + row);
    const prefix = 'assets/' + multi_string;

    if (index < 56) {
      return prefix + 'monster_board_piece.png'
    } else if (index < 70) {
      return prefix + 'eidolon_board_piece.png'
    } else if (index < 80) {
      return prefix + 'equipment_board_piece.png'
    } else if (index < 88) {
      return prefix + 'vehicle_board_piece.png'
    } else if (index < 93) {
      return prefix + 'creature_board_piece.png'
    } else if (index < 95) {
      return prefix + 'castle_board_piece.png'
    } else {
      return prefix + 'question_mark_board_piece.png'
    }
  }

  updateBoardPieceImage(row: number, col: number) {
    if (this.highlightedCardsHTML != null) {
      let imgChild = this.highlightedCardsHTML.children.item(0);
      if (imgChild != null) {
        let imgHTML: HTMLImageElement = imgChild as HTMLImageElement;
        imgHTML.src = this.getBoardPieceImage(row, col);
      }
    }
  }

}
