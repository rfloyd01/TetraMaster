import { Component, OnDestroy, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay, CardInfo } from '../../util/card-types';
import { CommonModule } from '@angular/common';
import { Gameplay } from '../../services/gameplay';
import { cardinalDirectionNeighbor, createDefaultStats, createDefaultStatsWithRandomArrows, createRandomStats, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandByUserSlotId } from '../../util/card-util';
import { GameState } from '../../util/gameplay-types';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { counter } from '../../util/general-utils';
import { checkForNeighboringCard } from '../../util/gameplay-utils';

@Component({
  selector: 'app-test-gameboard-component',
  imports: [Card, CommonModule],
  templateUrl: './test-gameboard-component.html',
  styleUrl: './test-gameboard-component.css'
})
export class TestGameboardComponent implements OnInit, OnDestroy {
  //Enum imports for data binding
  attackStyle = AttackStyle;
  cardDisplay = CardDisplay;

  //Card Arrays
  gridCards: CardInfo[] = [];
  playerCards: CardInfo[] = [];
  opponentCards: CardInfo[] = [];

  //State Variables
  selectedCard!: CardInfo | null;
  playerCanMove!: boolean;
  opponentCanMove!: boolean;
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
    this.gameplayService.setNewOpponent({cardLevel: 0, skillLevel: 0});
    this.resetGameVariables();

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
    this.gridCards = this.gameplayService.getGameBoard();
  }

  quit() {
    this.router.navigate(['']);
  }

  resetGameVariables() {
    // this.gridCards = [];
    // this.playerCards = [];
    // this.opponentCards = [];

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
        compositeId: {
          boardLocation: i,
          uniqueId: 0,
          userSlot: 0,
          cardTypeId: 0
        },
        cardStats: createDefaultStats(),
        isSelected: false,
        cardDisplay: (assignedBlockers & (1 << i)) ? CardDisplay.BLOCKED : CardDisplay.EMPTY,
        cardText: ''
      });
    }
  }

  createPlayerCards() {
    //Generate 10 cards with randomized stats and give them to the player and opponent
    for (let i:number = 0; i < 5; i++) {
      this.opponentCards.push({compositeId: {boardLocation: 0, userSlot: i + 100, uniqueId: 0, cardTypeId: 0}, cardStats: createDefaultStatsWithRandomArrows(), isSelected: false, cardDisplay: CardDisplay.ENEMY, cardText: ''});
      // this.opponentCards.push({id: i + 100, cardStats: createRandomStats(), isSelected: false, cardDisplay: CardDisplay.ENEMY, cardText: ''});
      this.playerCards.push({compositeId: {boardLocation: 0, userSlot: i + 105, uniqueId: 0, cardTypeId: 0}, cardStats: createRandomStats(), isSelected: false, cardDisplay: CardDisplay.FRIEND, cardText: ''});
    }
  }

  selectCard(card: CardInfo) {
    //Don't let the player select a card if it isn't their turn
    let eligibleCards: CardInfo[] | null = null;

    if (this.playerCanMove && card.compositeId.userSlot >= 105) {
      eligibleCards = this.playerCards;
    } else if(this.opponentCanMove && card.compositeId.userSlot < 105) {
      eligibleCards = this.opponentCards;
    }

    if (eligibleCards != null) {
      //First iterate over all other cards in the player's hand and make sure they're deselected
      for (let eligibleCard of eligibleCards) {
        if (eligibleCard.compositeId.userSlot != card.compositeId.userSlot && eligibleCard.isSelected) {
          eligibleCard.isSelected = false; //only set if current value is true
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
      this.gridCards[gridIndex].cardDisplay = this.playerCanMove ? CardDisplay.FRIEND : CardDisplay.ENEMY;
      this.gridCards[gridIndex].cardStats = this.selectedCard.cardStats;
      this.gridCards[gridIndex].isSelected = false;

      //Copy the composite id of the played card to the grid card, with the exception of the board location
      //(this variable is used for CSS purposes and needs to remain the same)
      this.gridCards[gridIndex].compositeId.cardTypeId = this.selectedCard.compositeId.cardTypeId;
      this.gridCards[gridIndex].compositeId.uniqueId = this.selectedCard.compositeId.uniqueId;
      this.gridCards[gridIndex].compositeId.userSlot = this.selectedCard.compositeId.userSlot;

      //Remove the card from the player's hand
      removeCardFromHandByUserSlotId(this.selectedCard.compositeId.userSlot, this.playerCanMove ? this.playerCards : this.opponentCards);
      this.selectedCard = null;

      //If a multi-battle scenario pops up, lock player out from selecting another card mid-turn
      this.playerCanMove = false;

      //After placing card on board and removing from hand, initiate game play sequence
      this.gameplayService.playerTurn(this.gridCards[gridIndex]);
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
    const currentBattleCardLocation = currentBattleCard.compositeId.boardLocation;
    for (let i = 0; i < 8; i++) {
      addBattleString = false;
      if (checkForNeighboringCard(currentBattleCardLocation, ORDERED_CARDINAL_DIRECTIONS[i], this.gridCards, this.gridCards[gridIndex].cardDisplay)) {
        if ((gridIndex - currentBattleCardLocation) == cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])) {
          addBattleString = true;
        }

        //Remove any text displayed on each of the neighboring cards
        if (this.gridCards[currentBattleCardLocation + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText != '') {
          this.gridCards[currentBattleCardLocation + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText = '';
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
    this.gameplayService.battlePhase(currentBattleCard, fauxActionArray);
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
    this.opponentCanMove = false;
    this.selectionType = 0; //makes sure selected card will be placed onto the board
  }

  opponentsTurn() {
    //First lock out the player from making any moves
    this.playerCanMove = false; //allows player to select card from inventory
    this.opponentCanMove = true;
    this.selectionType = 0; //makes sure selected card will be placed onto the board
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
