import { Component, OnInit } from '@angular/core';
import { Card } from '../card/card';
import { AttackStyle, CardDisplay, CardInfo } from '../../util/card-types';
import { CommonModule } from '@angular/common';
import { Gameplay } from '../../services/gameplay';
import { cardinalDirectionNeighbor, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandById } from '../../util/card-util';
import { GameState } from '../../util/gameplay-types';

@Component({
  selector: 'app-home',
  imports: [Card, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  //Enum imports for data binding
  attackStyle = AttackStyle;
  cardDisplay = CardDisplay;

  //Card Arrays
  gridCards!: CardInfo[];
  playerCards!: CardInfo[]; //TODO: Eventually these will be passed in as an input variable
  opponentCards!: CardInfo[];

  //State Variables
  gamePhase!: number;
  selectedCard!: CardInfo | null;
  // currentBattleCard!: CardInfo | null;
  playerGoesFirst!: number;
  playerCanMove!: boolean;
  selectionType!: number;

  constructor(private gameplayService: Gameplay) {
  }

  ngOnInit(): void {
    this.startNewGame();
    this.gameplayService.gameplayUpdate.subscribe(
      (value) => {
        // this.handleGameStateUpdate(value);
        this.advanceGame(value);
      }
    )
  }

  startNewGame() {
    console.log('Starting a new game');
    
    this.resetGameVariables();
    this.createRandomBoard();
    this.createPlayerCards();
    // this.advanceGame();
  }

  resetGameVariables() {
    this.gridCards = [];
    this.playerCards = [];
    this.opponentCards = [];

    this.gamePhase = 0;
    this.selectedCard = null;
    // this.currentBattleCard = null;
    this.playerGoesFirst = 0;
    this.playerCanMove = false;
    this.selectionType = 0; //Selecting a grid space will either play a card, or choose an opponent card for battle
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
        cardStats: this.createDefaultStats(),
        isSelected: false,
        cardDisplay: (assignedBlockers & (1 << i)) ? CardDisplay.BLOCKED : CardDisplay.EMPTY,
        cardText: ''
      });
    }
  }

  createPlayerCards() {
    //Generate 10 cards with randomized stats and give them to the player and opponent
    //TODO: Eventually the player will be able to collect and choose which cards
    //      they want to play with.
    this.playerCards = []; //clear out any existing cards

    for (let i:number = 0; i < 5; i++) {
      this.opponentCards.push({id: i + 100, cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.BACK, cardText: '' });
      this.playerCards.push({id: i + 105, cardStats: this.createRandomStats(), isSelected: false, cardDisplay: CardDisplay.FRIEND, cardText: '' });
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

  createDefaultStats() {
    return this.createStats(0, 0, AttackStyle.PHYSICAL, 0, 0);
  }

  createRandomStats() {
    //Generate the AttackStyle. There's an 90% chance for a standard attack type,
    //9% chance for the Flexible style and a 1% chance for Assault style
    let attackStyleNum = randomInteger(100)
    let attackStyle: AttackStyle;

    if (attackStyleNum < 90) {
      if (attackStyleNum % 2 == 0) {
        attackStyle = AttackStyle.PHYSICAL
      } else {
        attackStyle = AttackStyle.MAGICAL;
      }
    } else if (attackStyleNum < 99) {
      attackStyle = AttackStyle.FLEXIBLE
    } else {
      attackStyle = AttackStyle.ASSUALT;
    }

    return this.createStats(randomInteger(256), randomInteger(256), attackStyle, randomInteger(256), randomInteger(256));
  }

  createStats(activeArrows: number, attackPower: number, attackStyle: AttackStyle,
  physicalDefense:number, magicalDefense: number) {
    return {
      activeArrows: activeArrows,
      attackPower: attackPower,
      attackStyle: attackStyle,
      physicalDefense: physicalDefense,
      magicalDefense: magicalDefense
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
      this.gameplayService.playersTurn(this.gridCards[gridIndex], this.gridCards);
    } 
  }

  chooseOpponentCardToBattle(gridIndex: number) {
    //When the player selects a card to battle, the initiateCardBattles method is called with a 
    //non-null action array which will have a single battle element. This will force a battle to 
    //take place with the selected card.
    // if (this.gameplayService.savedBattleCard) {
      
      // const battleCardId= this.currentBattleCard.id; //save id before setting null for potential recursive call of this method
      

      // if (battleResult == 1) {
      //   //The battle was won by the attacking card so the turn goes on. Depending on how any chain reactions
      //   //went there may or may not be more battles/chaining that need to happen. Instead of calling the battle
      //   //method directly, recursively call the playSelectedCard method so new action array can be calculated.
      //   this.playSelectedCard(battleCardId);
      // }
    // }
    const currentBattleCard = this.gameplayService.attackingCard;
    if (currentBattleCard == null) {
      return
    }
    
    let fauxActionArray: (string | null)[] = [];
    let addBattleString;
    for (let i = 0; i < 8; i++) {
      addBattleString = false;
      if (this.gameplayService.checkForNeighboringCard(currentBattleCard, ORDERED_CARDINAL_DIRECTIONS[i], this.gridCards, this.gridCards[gridIndex].cardDisplay)) {
        if ((gridIndex - currentBattleCard.id) == cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])) {
          addBattleString = true;
        }

        //Remove any text displayed on each of the neighboring cards
        console.log('Removing text from following card: ' + JSON.stringify(this.gridCards[currentBattleCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])]));
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
    this.gameplayService.playersTurn(currentBattleCard, this.gridCards, fauxActionArray);
  }

  advanceGame(state: GameState) {
    //There are 12 phases of the game.
    //Phase 1 - Coin flip to see who goes first
    //Phases 2 through 11 - Players put cards onto the board
    //Phase 12 - Game is over with option to play again or quit
    this.gamePhase++;

    // if (this.gamePhase == 1) {
    if (state == GameState.GAME_START) {
      //A new game has been started. Randomly select who will go first
      //and then advance the game
      setTimeout(() => {
        this.gameplayService.startNewGame();
      }, 10); //TODO: Animate coin flip here and increase timeout time
    } else if (state == GameState.PLAYER_SELECT_BATTLE) {
      //If the player puts down a card and two or more opponent cards have matching
      //arrows, the player will need to choose which of the opponent cards to 
      //battle with.
      this.selectionType = 1;
    } else if (state == GameState.GAME_END) {
      //Display buttons that will either start a new game or quit
    } else {
      //It will either be the player's or opponent's turn depending
      //on who won the coin toss
      // if (this.gamePhase % 2 == this.playerGoesFirst) {
      if (state == GameState.PLAYER_TURN) {
        this.startPlayerTurn();
      } else {
        this.opponentsTurn();
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

    //Make the move for the opponent and advance the game state,
    //but wrap this in a slight delay so it looks like the opponent
    //is thinking for a bit
    setTimeout(() => {
      //this.gameplayService.randomizeOpponentsTurn(this.opponentCards, this.gridCards); //TODO: For now simply make the opponent move to a random location
      this.gameplayService.opponentsTurn(this.opponentCards, this.gridCards);
      // this.advanceGame();
    }, 1000);
  }

  counter(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

}
