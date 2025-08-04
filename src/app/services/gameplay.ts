import { Injectable } from '@angular/core';
import { AttackStyle, CardDisplay, CardinalDirection, CardInfo, CardStats } from '../util/card-types';
import { cardinalDirectionNeighbor, cardinalDirectionToIndex, getOppositeCardinalDirection, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandById } from '../util/card-util';
import { CARD_TIMER_INITIAL_DISPLAY, CARD_TIMER_LENGTH } from '../components/card/card';
import { BehaviorSubject } from 'rxjs';
import { BattleResult, GameState } from '../util/gameplay-types';

@Injectable({
  providedIn: 'root'
})
export class Gameplay {
  //This service implements logic for controlling a game. Card battles,
  //assigning

  gameplayUpdate: BehaviorSubject<GameState> = new BehaviorSubject<GameState>(GameState.GAME_INIT);

  opponentLevel: number = -1;
  currentState: GameState = GameState.GAME_START;
  cardsPlayed: number = 0;

  playerCards!: CardInfo[];

  attackingCard!: CardInfo | null;
  defendingCard!: CardInfo | null;

  private setAndEmitState(state: GameState) {
    this.currentState = state;
    this.gameplayUpdate.next(this.currentState);
  }

  setPlayerCards(cards: CardInfo[]) {
    //When the player has selected their cards from the home screen and hit the 'New Game'
    //button, their cards will be set in the service and then injected into the game
    this.playerCards = cards;
  }

  getPlayerCards() {
    return this.playerCards
  }

  startNewGame() {
    //Initialize variables with default values and then emit the Game Start state
    this.setAndEmitState(GameState.GAME_START);
  }

  coinFlip() {
    //Randomly select one of the players to go first and then emit the appropriate game state
    this.setAndEmitState(randomInteger(3, 1));
  }

  applyCoinFlip(winner: GameState) {
    //The logic for flipping the coin occurs in the game board component (as it needs to handle
    //the flipping of the coin in the beginning). Once that is done, the winner is passed into 
    //this method to start the game
    this.setAndEmitState(winner);
  }

  advanceToNextState() {
    if (this.cardsPlayed == 10) {
      this.cardsPlayed = 0;
      this.setAndEmitState(GameState.GAME_END);
    } else if (this.currentState == GameState.PLAYER_TURN || this.currentState == GameState.PLAYER_SELECT_BATTLE) {
      this.setAndEmitState(GameState.OPPONENT_TURN);
    } else if (this.currentState == GameState.OPPONENT_TURN) {
      this.setAndEmitState(GameState.PLAYER_TURN);
    }
  }

  battlePhase(playedCard: CardInfo, gameBoard: CardInfo[], actionArray?:(string | null)[]) {
    //This method get's called after the player puts a card onto the board. It will handle
    //Battles, capturing of enemy cards, etc. before advancing the game to the next state.
    if (playedCard == null) {
      console.warn('Incorrect card selection');
      return;
    }

    this.attackingCard = playedCard;
    actionArray ??= this.generateActionArray(playedCard, gameBoard, false); //generate action array before battle phase
    const result = this.initiateCardBattles(gameBoard, actionArray);

    if (result == BattleResult.NO_BATTLE) {
      //If no battle occured then simply update the state, take any defenseless cards, and update the game state
      this.captureDefenselessCards(this.attackingCard, actionArray, gameBoard);
      this.attackingCard = null; //reset the attacking card
      this.advanceToNextState();
    } else if ((this.currentState == GameState.PLAYER_TURN) && (result == BattleResult.NEED_PLAYER_INPUT)) {
      //If we need player input then we also immediately return from this method.
      //Save a copy of the current played card before emitting the state
      this.setAndEmitState(GameState.PLAYER_SELECT_BATTLE);
    } else {
      //If a battle has occured we need to wrap any state updates inside of a timer. This is 
      //to ensure that there's enough time to animate the battle happening.
      setTimeout(() => {
        if (this.attackingCard && this.defendingCard) {
          if (result != BattleResult.LOST_BATTLE) {
            //The player won the fight. Take over the enemy card as well as any chained cards.
            this.defendingCard.cardDisplay = this.attackingCard.cardDisplay;
            let chainedCards = this.generateActionArray(this.defendingCard, gameBoard, true);
            this.captureDefenselessCards(this.defendingCard, chainedCards, gameBoard);
            this.captureDefenselessCards(this.attackingCard, actionArray, gameBoard);
            
            //If the current state of the game is 'player select battle'
            //then it's possible there are more battles to carry out. Recursively call this method
            //with the same card but a null action array to continue
            //if (this.currentState == GameState.PLAYER_SELECT_BATTLE) {
            if (result == BattleResult.NEED_PLAYER_INPUT) {
              this.battlePhase(playedCard, gameBoard);
              return; //state emission will happen at lower recursion level so simply return
            } 
          } else {
            //The attacking card lost the fight so it gets converted to the other team and
            //chaining happens
            this.attackingCard.cardDisplay = this.defendingCard.cardDisplay;
            let chainedCards = this.generateActionArray(this.attackingCard, gameBoard, true);
            this.captureDefenselessCards(this.attackingCard, chainedCards, gameBoard);
          }
        } else {
          console.warn('Attack or defense card was\'t set');
        }
        
        //Change the state to opponents turn when player turn is done
        this.attackingCard = null; //if a battle card was saved during this turn remove it
        this.defendingCard = null;
        this.advanceToNextState();
      }, CARD_TIMER_LENGTH  + CARD_TIMER_INITIAL_DISPLAY + 5);
    } 
  }

  playerTurn(playedCard: CardInfo, gameBoard: CardInfo[]) {
    //Since the player chooses their own card there isn't any extra logic to do.
    //Simply increment the cards played counter and start the battle phase.
    this.cardsPlayed++;
    this.battlePhase(playedCard, gameBoard);
  }

  opponentsTurn(opponentsCards: CardInfo[], gameBoard: CardInfo[]): void {
    //This method holds the logic for making the opponent's move. What the opponent does with 
    //their turn will be a factor of the cards that they have, the cards currently on the board,
    //and the selected skill level of the opponent.

    //First, select the card to play and the grid space to play it in
    let cardAndLocation = this.randomizeOpponentsTurn(opponentsCards, gameBoard);
    if (this.opponentLevel >= 0) {
      //TODO: Add more opponent levels
    }

    //Afterpicking the card remove it from the opponent's hand, add it to 
    //the board, then initiate the card battle sequence
    cardAndLocation.location.cardDisplay = CardDisplay.ENEMY;
    cardAndLocation.location.cardStats = cardAndLocation.card.cardStats;
    removeCardFromHandById(cardAndLocation.card.id, opponentsCards);

    this.cardsPlayed++;
    this.battlePhase(cardAndLocation.location, gameBoard);
  }

  randomizeOpponentsTurn(oppentsCards: CardInfo[], gameBoard: CardInfo[]): {card: CardInfo, location: CardInfo} {
    //The easiest mode to implement, there is no logic behind the opponent's moves, they simply
    //play a random card in a random location of the board, regardless of arrow configurations
    //or card stats.

    //First pick a random card for the opponent
    const playCard = oppentsCards[randomInteger(oppentsCards.length)];

    //Next pick a random open slot on the board. Make this step easier
    //by first filtering out all non-empty spaces.
    const emptySpaces = gameBoard.filter(space => space.cardDisplay == CardDisplay.EMPTY);
    let playSpace = emptySpaces[randomInteger(emptySpaces.length)];

    //Return the selected card and board location
    return {card: playCard, location: playSpace};
  }

  chooseOpponentAttackingCard(attackingCard: CardInfo, actionArray: (string | null)[], board: CardInfo[]): (CardInfo | null) {
    //When the opponent plays a card, if multiple battles can arise from it, this method will choose which
    //card the opponent will choose to attack first. The choice will depend on the current level of the
    //opponent.
    
    //Regardless of the opponent's level, first convert the action array (a list showing neighbors of the 
    //attacking card and whether they can be battled or captured without a fight) into a list of actual
    //cards.
    let defendingCards: CardInfo[] = [];
    for (let i:number = 0; i < 8; i++) {
      if (actionArray[i] == 'battle') {
        defendingCards.push(board[attackingCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])]);
      }
    }

    if (defendingCards.length > 0) {
      if (this.opponentLevel == -1) {
        //At this level just randomly select the card to attack
        return defendingCards[randomInteger(defendingCards.length)];
      }

      return defendingCards[0]
    }
    
    return null;
  }

  initiateCardBattles(board: CardInfo[], actionArray:(string | null)[]): BattleResult {
    //Return values for this method:
    //-2: error
    //-1: require player input to continue
    // 0: no fight occured
    // 1: fight occured and attacking card lost
    // 2: fight occured and attacking card won
    
    //When a card is placed on the board, if one of its arrows faces a card from the 
    //other player then a card battle will be initiated. If the opposing card doesn't
    //have a reciprical arrow pointing at the new card, then the opposing card will be 
    //caputred without a fight. If the opposing card does have a reciprical arrow though
    //a battle will take place between the two cards, with the victor capturing the other
    //card (and potentially chaining this into other cards).

    //First create an array representing the 8 cardinal directions around the placed card.
    //If there are opposing cards in that spot relative to the new card then a reference will
    //be added to this array.
    // actionArray ??= this.generateActionArray(battleCard, board, false); //TODO: make sure this commented out lines behaves the same as below block
    // if (!actionArray) {
    //   actionArray = this.generateActionArray(battleCard, board, false);
    // }

    //If there is a single battle in the action array then carry it out, if there are multiple battles
    //the player gets to decide which battle to start first.
    if (this.attackingCard == null) {
      console.warn('Attacking card not set');
      return BattleResult.ERROR;
    }

    let battleCount = actionArray.filter(item => item === 'battle').length;
    let battleWon = false;
    if (battleCount == 1) {
      //Carry out the single battle
      const defendingCardDirection = ORDERED_CARDINAL_DIRECTIONS[actionArray.indexOf('battle')];
      this.defendingCard = board[this.attackingCard.id + cardinalDirectionNeighbor(defendingCardDirection)];

      if (this.handleCardBattle(this.attackingCard, this.defendingCard) == this.attackingCard.id) {
        battleWon = true;
      } else {
        //The attacking card has lost, convert it to the other team and return from this method
        return BattleResult.LOST_BATTLE;
      }

    } else if (battleCount >= 1) {
      //If there are multiple cards that a battle can happen with then the player gets to choose
      //which one to attack. If the computer player is in this situation then card to attack will
      //be randomly selected based on the computer's level
      if (this.attackingCard.cardDisplay == CardDisplay.FRIEND) {
        //Put text into each of the potential battle cards that says "Choose a Card" to alert the
        //player that they get to choose which card to battle. Return false from this method to indicate
        //that we're still in the battle phase
        for (let i:number = 0; i < 8; i++) {
          if (actionArray[i] == 'battle') {
            board[this.attackingCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText = 'Select a Card';
          }
        }
      } else {
        this.defendingCard = this.chooseOpponentAttackingCard(this.attackingCard, actionArray, board);

        if (!this.defendingCard) {
          return BattleResult.ERROR; //indicates that there was some error in picking a card to attack
        }

        if (this.handleCardBattle(this.attackingCard, this.defendingCard) != this.attackingCard.id) {
          return BattleResult.LOST_BATTLE;
        } 
      }

      //Either an attacking opponent won the battle or input is needed from the user, the same
      //status is returned from this method either way
      return BattleResult.NEED_PLAYER_INPUT;
    }

    return battleWon ? BattleResult.WON_BATTLE : BattleResult.NO_BATTLE;
  }

  generateActionArray(battleCard: CardInfo, board: CardInfo[], chain: boolean) {
    let actionArray: (string | null)[] = [null, null, null, null, null, null, null, null];

    Object.keys(CardinalDirection).filter(key => !isNaN(Number(key))).forEach((key) => {
      const direction = Number(key);
      const hasNeighbor = this.checkForNeighboringCard(battleCard, direction, board,
        battleCard.cardDisplay == CardDisplay.FRIEND ? CardDisplay.ENEMY: CardDisplay.FRIEND);

      if (hasNeighbor) {
        let neighboringCard = board[battleCard.id + cardinalDirectionNeighbor(direction)];

        //If the neighboring card has an opposing arrow then set the appropriate index of the 
        //action array to 'battle', otherwise set it to 'capture'
        const opposingArrowDirection = getOppositeCardinalDirection(direction);
        if (chain) {
          actionArray[cardinalDirectionToIndex(direction)] = 'chain';
        } else if (neighboringCard.cardStats.activeArrows & opposingArrowDirection) {
          actionArray[cardinalDirectionToIndex(direction)] = 'battle';
        } else {
          actionArray[cardinalDirectionToIndex(direction)] = 'capture';
        }
      }
    });

    return actionArray;
  }

  checkForNeighboringCard(currentCard: CardInfo, direction: number, board: CardInfo[], opponentDisplay: CardDisplay): boolean {
    //Before checking for neighbor, first see if the currentCard has an arrow pointing in the given direction
    if (!(currentCard.cardStats.activeArrows & (1 << cardinalDirectionToIndex(direction)))) {
      return false;
    }

    let onUpperEdge: boolean = (currentCard.id < 4);
    let onRightEdge: boolean = (currentCard.id % 4 == 3);
    let onLowerEdge: boolean = (currentCard.id >= 12);
    let onLeftEdge:  boolean = (currentCard.id % 4 == 0);
    let neighborsOk: boolean = true;

    switch (direction) {
      case CardinalDirection.NW:
        neighborsOk = (!onUpperEdge && !onLeftEdge);
        break;
      case CardinalDirection.N:
        neighborsOk = !onUpperEdge;
        break
      case CardinalDirection.NE:
        neighborsOk = (!onUpperEdge && !onRightEdge);
        break;
      case CardinalDirection.E:
        neighborsOk = !onRightEdge;
        break;
      case CardinalDirection.SE:
        neighborsOk = (!onRightEdge && !onLowerEdge);
        break;
      case CardinalDirection.S:
        neighborsOk = !onLowerEdge;
        break;
      case CardinalDirection.SW:
        neighborsOk = (!onLeftEdge && !onLowerEdge);
        break;
      case CardinalDirection.W:
        neighborsOk = !onLeftEdge;
        break;
      default:
        neighborsOk = false;
        break;
    }

    return neighborsOk && (board[currentCard.id + cardinalDirectionNeighbor(direction)].cardDisplay == opponentDisplay);
  }

  handleCardBattle(attackingCard: CardInfo, defendingCard: CardInfo): number {
    //This method carries out the logic for a single card battle and returns the id of the 
    //winning card. The way that a battle works is as follows:
    //
    //1. The defending card's appropriate stat is picked based on the attack type of the attacking card
    //    - P = Physical Defense, M = Magical Defense, X = Lower of Physical and Magical, A = Lower of Attack, Physical D and Magical D
    //2. Choose a random number, s, between 0 and Attacking card's attack, x
    //3. Choose a random number, r, between 0 and Defending card's defense, y
    //4. If (x - s) > (y - r) the attacking card wins, otherwise the defending card wins (tie goes to defense)
    //5. If the attacking card wins, a chain is initiated, otherwise the battle is over
    const defense = this.getDefenseiveNumber(attackingCard.cardStats.attackStyle, defendingCard.cardStats);
    const attackRoll = randomInteger(attackingCard.cardStats.attackPower);
    const attackDiff = attackingCard.cardStats.attackPower - attackRoll;
    const defenseRoll = randomInteger(defense);
    const defenseDiff = defense - defenseRoll;

    //After calculating all numbers, create 'timers' for each card and display them 
    //to the player to see. Wrap this whole operation in a timer itself so that
    //gameplay doesn't resume until the battle timers are finished
    this.setBattleAnimation(attackingCard, attackingCard.cardStats.attackPower, attackDiff);
    this.setBattleAnimation(defendingCard, defense, defenseDiff);

    return (attackDiff > defenseDiff) ? attackingCard.id : defendingCard.id;
  }

  getDefenseiveNumber(attackType: AttackStyle, defendingCardStats:CardStats): number {
    switch (attackType) {
      case AttackStyle.PHYSICAL: return defendingCardStats.physicalDefense;
      case AttackStyle.MAGICAL : return defendingCardStats.magicalDefense;
      case AttackStyle.FLEXIBLE: return Math.min(defendingCardStats.physicalDefense, defendingCardStats.magicalDefense);
      case AttackStyle.ASSUALT : return Math.min(defendingCardStats.attackPower, defendingCardStats.physicalDefense, defendingCardStats.magicalDefense);
    }
  }

  captureDefenselessCards(capturingCard: CardInfo, neighboringCards: (string | null)[], board: CardInfo[]) {
    for (let cardinalDirection of ORDERED_CARDINAL_DIRECTIONS) {
      const text = neighboringCards[cardinalDirectionToIndex(cardinalDirection)];
      if (text == 'capture' || text == 'chain') {
        board[capturingCard.id + cardinalDirectionNeighbor(cardinalDirection)].cardDisplay = capturingCard.cardDisplay;
      }
    }
  }

  setBattleAnimation(card: CardInfo, upperBound: number, lowerBound: number) {
    //This method both starts a timer for the given card, but also sets a second
    //(much shorter) timer for resetting the card text within the game context.
    //This might seem like an unneccesary step, however, in the slim change that
    //another timer for the same card is set with the exact same upper and lower bound,
    //Angular won't detect the change and no timer will actually get set.
    card.cardText = 'Timer: ' + upperBound + ' ' + lowerBound;
    setTimeout(() => {
      card.cardText = ''; //Reset text in gameplay context, card component will handle updating timer text itself
    }, CARD_TIMER_LENGTH  + CARD_TIMER_INITIAL_DISPLAY + 5); //delay this update until after timer is complete
  }
}
