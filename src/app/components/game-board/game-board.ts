import { Component, OnDestroy, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay, CardInfo } from '../../util/card-types';
import { CommonModule } from '@angular/common';
import { Gameplay } from '../../services/gameplay';
import { cardinalDirectionNeighbor, createDefaultStats, createRandomStats, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandById } from '../../util/card-util';
import { GameState } from '../../util/gameplay-types';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { counter } from '../../util/general-utils';
import { OpponentService } from '../../services/opponent-service';
import { checkForNeighboringCard } from '../../util/gameplay-utils';

@Component({
  selector: 'app-game-board',
  imports: [Card, CommonModule],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css'
})
export class GameBoard implements OnInit, OnDestroy {
  //Enum imports for data binding
  attackStyle = AttackStyle;
  cardDisplay = CardDisplay;

  //Card Arrays
  gridCards!: CardInfo[];
  playerCards!: CardInfo[];
  opponentCards!: CardInfo[];

  //State Variables
  selectedCard!: CardInfo | null;
  playerCanMove!: boolean;
  selectionType!: number;
  displayButtons!: boolean;
  gameplaySubscription!: Subscription | null;

  //Coin FLipping Variables
  showCoin: boolean = false;
  coinFlipSub!: Subscription | null;
  coinImagePrefix: string = 'assets/coin_'
  coinImageNumber: number = 0;
  coinImageType: string = '.png';
  currentTicks: number = 0;
  flipTicks: number = 0;
  totalTicks: number = 100;
  activeCoinFlipTime: number = 1000; //dureation of coin flip in ms where coin is spinning
  totalCoinFlipTime: number = 1500; //dureation of entire coin flip in ms
  coinFlipAnimationSpeed: number = 50; //time in ms between image changes for coin flip

  //Imported methods
  counter = counter;

  constructor(private readonly router: Router, private readonly gameplayService: Gameplay) {
  }

  ngOnInit(): void {
    //Subscribe to the gameplay update subscription
    //which is responsible for advancing the game state
    this.resetGameVariables();

    if (this.gameplaySubscription) {
      this.gameplaySubscription.unsubscribe();
    }

    this.gameplaySubscription = this.gameplayService.gameplayUpdate.subscribe(
      (value) => {
        this.advanceGame(value);
      }
    )

    this.startNewGame();
  }

  ngOnDestroy(): void {
    //Unsubscribe from the gameplayUpdate Behaviour Subject
    this.gameplaySubscription?.unsubscribe();

    //Reset the game state for the gameplay service
    this.gameplayService.currentState = GameState.GAME_INIT;
  }

  startNewGame() {
    console.log('Starting a new game');
    
    this.resetGameVariables();
    this.createRandomBoard();
    this.createPlayerCards();
    this.gameplayService.startNewGame();
  }

  quit() {
    this.router.navigate(['']);
  }

  resetGameVariables() {
    this.gridCards = [];
    this.playerCards = [];
    this.opponentCards = [];

    this.selectedCard = null;
    this.playerCanMove = false;
    this.selectionType = 0; //Selecting a grid space will either play a card, or choose an opponent card for battle
    this.displayButtons = false;
  }

  createRandomBoard() {
    //First generate a random number between 0 and 6, this will represent how many slots
    //in the board are blocked off.
    const blockers = randomInteger(6);

    //Randomly assign the blockers
    let assignedBlockers:number = 0b0;
    for (let i:number = 0; i < blockers; i++) {
      while (true) {
        const blockerLocation = randomInteger(16);
        if (!(assignedBlockers & (1 << blockerLocation))) {
          assignedBlockers |= (1 << blockerLocation);
          break;
        }
      }
    }

    //Once blockers are assigned create cards and place them into the grid
    //array. These cards will eventually have their stats overriden by player cards.
    for (let i: number = 0; i < 16; i++) {
      this.gridCards.push({
        id: i,
        cardStats: createDefaultStats(),
        isSelected: false,
        cardDisplay: (assignedBlockers & (1 << i)) ? CardDisplay.BLOCKED : CardDisplay.EMPTY,
        cardText: ''
      });
    }
  }

  createPlayerCards() {
    //Generate 10 cards with randomized stats and give them to the player and opponent
    this.playerCards = this.gameplayService.getPlayerCards();

    for (let i:number = 0; i < 5; i++) {
      this.opponentCards.push({id: i + 100, cardStats: createRandomStats(), isSelected: false, cardDisplay: CardDisplay.BACK, cardText: '' });
      this.playerCards[i].id = i + 105; //update the id for the player cards so that css loads properly
    }
  }

  selectPlayerCard(card: CardInfo) {
    //Don't let the player select a card if it isn't their turn
    if (this.playerCanMove) {
      //First iterate over all other cards in the player's hand and make sure they're deselected
      for (let playerCard of this.playerCards) {
        if (playerCard.id != card.id && playerCard.isSelected) {
          playerCard.isSelected = false; //only set if current value is true
        }
      }

      //Then flip the selection status of the selected card (deselecting is an option)
      card.isSelected = !card.isSelected;
      this.selectedCard = card.isSelected ? card : null;
    }
    
  }

  handleSelection(gridIndex: number, selectionType: number) {
    if (selectionType == 0) {
      this.playSelectedCard(gridIndex);
    } else {
      this.chooseOpponentCardToBattle(gridIndex);
    }
  }
  
  playSelectedCard(gridIndex: number) {
    if (this.selectedCard && (this.gridCards[gridIndex]).cardDisplay == CardDisplay.EMPTY) {
      //Add the stats of the selected card to the selected empty space in the grid.
      this.gridCards[gridIndex].cardDisplay = CardDisplay.FRIEND;
      this.gridCards[gridIndex].cardStats = this.selectedCard.cardStats;
      this.gridCards[gridIndex].isSelected = false;

      //Remove the card from the player's hand
      removeCardFromHandById(this.selectedCard.id, this.playerCards);
      this.selectedCard = null;

      //If a multi-battle scenario pops up, lock player out from selecting another card mid-turn
      this.playerCanMove = false;

      //After placing card on board and removing from hand, initiate game play sequence
      this.gameplayService.playerTurn(this.gridCards[gridIndex], this.gridCards);
    } 
  }

  chooseOpponentCardToBattle(gridIndex: number) {
    //When the player puts down a card, if multiple battles are possible then the player will need to select
    //which of the opponents cards to battle. This method handles the logic for selecting the opponent card
    //and removing text from the cards.
    const currentBattleCard = this.gameplayService.attackingCard;
    if (currentBattleCard == null) {
      return
    }

    let fauxActionArray: (string | null)[] = [];
    let addBattleString;
    for (let i = 0; i < 8; i++) {
      addBattleString = false;
      if (checkForNeighboringCard(currentBattleCard, ORDERED_CARDINAL_DIRECTIONS[i], this.gridCards, this.gridCards[gridIndex].cardDisplay)) {
        if ((gridIndex - currentBattleCard.id) == cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])) {
          addBattleString = true;
        }

        //Remove any text displayed on each of the neighboring cards
        if (this.gridCards[currentBattleCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText != '') {
          this.gridCards[currentBattleCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText = '';
        }
      }

      if (addBattleString) {
        fauxActionArray.push('battle');
      } else {
        fauxActionArray.push(null);
      }
    }

    //Initiate the selected battle, regardless of outcome of this battle the current battle card is set
    //back to a null value
    this.gameplayService.battlePhase(currentBattleCard, this.gridCards, fauxActionArray);
  }

  advanceGame(state: GameState) {
    //Most of the game flow happens through the gameplay service, however,
    //there are some things that the board component will handle depending
    //on the current game state, for example, letting the player choose
    //which card to play.
    switch (state) {
      case GameState.GAME_INIT:
        {
          //This is the initial value that gets emitted when the gameplay service is initialized
          //For now do nothing here.
          break;
        }
      case GameState.GAME_START:
        {
          //A new game has been started. Randomly select who will go first
          //and then advance the game
          this.resetCoinVariables();
          const winner = randomInteger(3, 1);
          this.calculateTicksForCoinFlip(winner);
          this.showCoin = true;

          setTimeout(() => {
            this.coinFlipSub = interval(this.coinFlipAnimationSpeed).subscribe(() => {
              this.currentTicks++;
              if (this.currentTicks <= this.flipTicks) {
                this.coinImageNumber = (this.coinImageNumber + 1) % 12;
                
              } else if (this.currentTicks >= this.totalTicks) {
                this.currentTicks = 0;
                this.coinFlipSub?.unsubscribe();
                this.coinFlipSub = null;
                this.showCoin = false;
                this.gameplayService.applyCoinFlip(winner);
              }
            });
          });
          break;
        }
      case GameState.PLAYER_SELECT_BATTLE:
        {
          //If the player puts down a card and two or more opponent cards have matching
          //arrows, the player will need to choose which of the opponent cards to 
          //battle with.
          this.selectionType = 1;
          break;
        }
      case GameState.GAME_END:
        {
          console.log('game over');
          this.displayButtons = true;
          break;
        }
      case GameState.PLAYER_TURN:
        {
          this.startPlayerTurn();
          break;
        }
      case GameState.OPPONENT_TURN:
        {
          this.opponentsTurn();
          break;
        }
    }
  }

  startPlayerTurn() {
    this.playerCanMove = true; //allows player to select card from inventory
    this.selectionType = 0; //makes sure selected card will be placed onto the board
  }

  opponentsTurn() {
    //First lock out the player from making any moves
    this.playerCanMove = false;

    //Make the move for the opponent but wrap this in a slight delay
    //so it looks like the opponent is thinking for a bit
    setTimeout(() => {
      this.gameplayService.opponentsTurn(this.opponentCards, this.gridCards);
    }, 1000);
  }

  calculateTicksForCoinFlip(winner: number) {
    //we want to make sure that the coin lands on the side of the winner
    //(blue for the player and red for the opponent). A little math is used
    //here to make sure that this occurs within the time frame of the flip.
    this.totalTicks = Math.round(this.totalCoinFlipTime / this.coinFlipAnimationSpeed);
    const baseTics = Math.round(this.activeCoinFlipTime / this.coinFlipAnimationSpeed);

    if (winner == 1) {
      //If the player should go first then we need the coin to stop on image 0
      this.flipTicks = baseTics + (12 - baseTics % 12);
    } else {
      //If the opponent should go first then we need the coin to stop on image 6
      this.flipTicks = baseTics + (6 - baseTics % 12);
    }
  }

  resetCoinVariables() {
    //Reset all variables pertaining to the coin flip to make sure it lands on the 
    //correct side each time.
    this.coinImageNumber = 0;
    this.currentTicks = 0;
    this.flipTicks = 0;
    this.totalTicks = 0;
  }

}
