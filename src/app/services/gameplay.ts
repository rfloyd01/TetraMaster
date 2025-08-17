import { Injectable } from '@angular/core';
import { AttackStyle, CardDisplay, CardInfo, CardStats } from '../util/card-types';
import { cardinalDirectionNeighbor, cardinalDirectionToIndex, createDefaultStats, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandByUserSlotId } from '../util/card-util';
import { CARD_TIMER_INITIAL_DISPLAY, CARD_TIMER_LENGTH } from '../components/card/card';
import { BehaviorSubject } from 'rxjs';
import { BattleResult, GameState, Opponent } from '../util/gameplay-types';
import { OpponentService } from './opponent-service';
import { generateActionArray } from '../util/gameplay-utils';
import { UserService } from './user-service';

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

  gameBoard!: CardInfo[];

  attackingCard!: CardInfo | null;
  defendingCard!: CardInfo | null;

  constructor(private readonly opponentService: OpponentService, private readonly userService: UserService) {}

  private setAndEmitState(state: GameState) {
    this.currentState = state;
    this.gameplayUpdate.next(this.currentState);
  }

  setNewOpponent(opponent: Opponent) {
    this.opponentService.setOpponent(opponent);
  }

  getPlayerCards() {
    return this.userService.getCurrentUserCards();
  }

  getOpponentCards() {
    return this.opponentService.getOpponentCards();
  }

  getGameBoard() {
    return this.gameBoard;
  }

  getOpponentCardsOnBoard() {
    return this.gameBoard.filter(card => card.cardDisplay == CardDisplay.ENEMY).length;
  }

  getPlayerCardsOnBoard() {
    return this.gameBoard.filter(card => card.cardDisplay == CardDisplay.FRIEND).length;
  }

  startNewGame() {
    //Initialize variables with default values, generate opponent cards and then emit the Game Start state
    this.opponentService.generateOpponentCards();
    this.createRandomBoard();

    this.setAndEmitState(GameState.GAME_START);
  }

  createRandomBoard() {
    //First generate a random number between 0 and 6, this will represent how many slots
    //in the board are blocked off.
    this.gameBoard = [];
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
      this.gameBoard.push({
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
      this.putCardsBackIntoOriginalHands();
      this.setAndEmitState(GameState.GAME_END);
    } else if (this.currentState == GameState.PLAYER_TURN || this.currentState == GameState.PLAYER_SELECT_BATTLE) {
      this.setAndEmitState(GameState.OPPONENT_TURN);
    } else if (this.currentState == GameState.OPPONENT_TURN) {
      this.setAndEmitState(GameState.PLAYER_TURN);
    }
  }

  battlePhase(playedCard: CardInfo, actionArray?:(string | null)[]) {
    //This method get's called after the player puts a card onto the board. It will handle
    //Battles, capturing of enemy cards, etc. before advancing the game to the next state.
    if (playedCard == null) {
      console.warn('Incorrect card selection');
      return;
    }

    this.attackingCard = playedCard;
    actionArray ??= generateActionArray(playedCard.cardStats, playedCard.compositeId.boardLocation, playedCard.cardDisplay, this.gameBoard, false); //generate action array before battle phase
    const result = this.initiateCardBattles(actionArray);

    if (result == BattleResult.NO_BATTLE) {
      //If no battle occured then simply update the state, take any defenseless cards, and update the game state
      this.captureDefenselessCards(this.attackingCard, actionArray);
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
            let chainedCards = generateActionArray(this.defendingCard.cardStats, this.defendingCard.compositeId.boardLocation, this.defendingCard.cardDisplay, this.gameBoard, true);
            this.captureDefenselessCards(this.defendingCard, chainedCards);
            this.captureDefenselessCards(this.attackingCard, actionArray);
            
            //If the current state of the game is 'player select battle'
            //then it's possible there are more battles to carry out. Recursively call this method
            //with the same card but a null action array to continue
            //if (this.currentState == GameState.PLAYER_SELECT_BATTLE) {
            if (result == BattleResult.NEED_PLAYER_INPUT) {
              this.battlePhase(playedCard);
              return; //state emission will happen at lower recursion level so simply return
            } 
          } else {
            //The attacking card lost the fight so it gets converted to the other team and
            //chaining happens
            this.attackingCard.cardDisplay = this.defendingCard.cardDisplay;
            let chainedCards = generateActionArray(this.attackingCard.cardStats, this.attackingCard.compositeId.boardLocation, this.attackingCard.cardDisplay, this.gameBoard, true);
            this.captureDefenselessCards(this.attackingCard, chainedCards);
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

  playerTurn(playedCard: CardInfo) {
    //Since the player chooses their own card there isn't any extra logic to do.
    //Simply increment the cards played counter and start the battle phase.
    this.cardsPlayed++;
    this.battlePhase(playedCard);
  }

  opponentsTurn(): void {
    //This method holds the logic for making the opponent's move. What the opponent does with 
    //their turn will be a factor of the cards that they have, the cards currently on the board,
    //and the selected skill level of the opponent.

    //First, select the card to play and the grid space to play it in
    let cardAndLocation = this.opponentService.makeMove(this.gameBoard);

    //Afterpicking the card remove it from the opponent's hand, add it to 
    //the board, then initiate the card battle sequence
    cardAndLocation.location.cardDisplay = CardDisplay.ENEMY;
    cardAndLocation.location.cardStats = cardAndLocation.card.cardStats;
    cardAndLocation.location.compositeId.cardTypeId = cardAndLocation.card.compositeId.cardTypeId;
    cardAndLocation.location.compositeId.uniqueId = cardAndLocation.card.compositeId.uniqueId;
    cardAndLocation.location.compositeId.userSlot = cardAndLocation.card.compositeId.userSlot;

    removeCardFromHandByUserSlotId(cardAndLocation.card.compositeId.userSlot, this.opponentService.getOpponentCards());

    this.cardsPlayed++;
    this.battlePhase(cardAndLocation.location);
  }

  chooseOpponentAttackingCard(attackingCard: CardInfo, actionArray: (string | null)[]): (CardInfo | null) {
    //When the opponent plays a card, if multiple battles can arise from it, this method will choose which
    //card the opponent will choose to attack first. The choice will depend on the current level of the
    //opponent.
    
    //Regardless of the opponent's level, first convert the action array (a list showing neighbors of the 
    //attacking card and whether they can be battled or captured without a fight) into a list of actual
    //cards.
    let defendingCards: CardInfo[] = [];
    for (let i:number = 0; i < 8; i++) {
      if (actionArray[i] == 'battle') {
        defendingCards.push(this.gameBoard[attackingCard.compositeId.boardLocation + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])]);
      }
    }

    if (defendingCards.length > 0) {
      if (this.opponentLevel == -1) {
        //At this level just randomly select the card to attack
        return defendingCards[randomInteger(defendingCards.length)];
      }

      return defendingCards[0];
    }
    
    return null;
  }

  initiateCardBattles(actionArray:(string | null)[]): BattleResult {
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
      this.defendingCard = this.gameBoard[this.attackingCard.compositeId.boardLocation + cardinalDirectionNeighbor(defendingCardDirection)];

      if (this.handleCardBattle(this.attackingCard, this.defendingCard) == this.attackingCard.compositeId.boardLocation) {
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
            this.gameBoard[this.attackingCard.compositeId.boardLocation + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText = 'Select a Card';
          }
        }
      } else {
        this.defendingCard = this.chooseOpponentAttackingCard(this.attackingCard, actionArray);

        if (!this.defendingCard) {
          return BattleResult.ERROR; //indicates that there was some error in picking a card to attack
        }

        if (this.handleCardBattle(this.attackingCard, this.defendingCard) != this.attackingCard.compositeId.boardLocation) {
          return BattleResult.LOST_BATTLE;
        } 
      }

      //Either an attacking opponent won the battle or input is needed from the user, the same
      //status is returned from this method either way
      return BattleResult.NEED_PLAYER_INPUT;
    }

    return battleWon ? BattleResult.WON_BATTLE : BattleResult.NO_BATTLE;
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

    return (attackDiff > defenseDiff) ? attackingCard.compositeId.boardLocation : defendingCard.compositeId.boardLocation;
  }

  getDefenseiveNumber(attackType: AttackStyle, defendingCardStats:CardStats): number {
    switch (attackType) {
      case AttackStyle.PHYSICAL: return defendingCardStats.physicalDefense;
      case AttackStyle.MAGICAL : return defendingCardStats.magicalDefense;
      case AttackStyle.FLEXIBLE: return Math.min(defendingCardStats.physicalDefense, defendingCardStats.magicalDefense);
      case AttackStyle.ASSUALT : return Math.min(defendingCardStats.attackPower, defendingCardStats.physicalDefense, defendingCardStats.magicalDefense);
    }
  }

  captureDefenselessCards(capturingCard: CardInfo, neighboringCards: (string | null)[]) {
    for (let cardinalDirection of ORDERED_CARDINAL_DIRECTIONS) {
      const text = neighboringCards[cardinalDirectionToIndex(cardinalDirection)];
      if (text == 'capture' || text == 'chain') {
        this.gameBoard[capturingCard.compositeId.boardLocation + cardinalDirectionNeighbor(cardinalDirection)].cardDisplay = capturingCard.cardDisplay;
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

  putCardsBackIntoOriginalHands() {
    //When the game is over the winner gets to steal one of the cards from the loser. 
    //The computer player will obviously do this automatically, but to make things easier for 
    //the player to decide, all cards are returned back into their original location in 
    //the player and opponent's hands. Any card that has been turned will keep it's new 
    //color.

    //Player cards will be ones where the userSlot is < 105, opponent cards have a userSlot >= 105
    const originalOpponentCards = this.gameBoard.filter(space => (space.compositeId.userSlot >= 100) && (space.compositeId.userSlot < 105)).sort((a, b) => a.compositeId.userSlot - b.compositeId.userSlot);
    const originalPlayerCards = this.gameBoard.filter(space => space.compositeId.userSlot >= 105).sort((a, b) => a.compositeId.userSlot - b.compositeId.userSlot);

    for (let card of originalPlayerCards) {
      this.userService.addCardToCurrentHand(card);
    }

    for (let card of originalOpponentCards) {
      this.opponentService.addOpponentCard(card);
    }
  }

  stealPlayerCard() {
    //If the opponent wins the game they get to steal one of the players cards. This change is permanent
    //and will be persisted in the database. In the case that the opponent has a perfect game, then the 
    //player will lose all 5 of the cards they used in the game.
    if (this.getPlayerCardsOnBoard() == 0) {
      this.userService.removeCurrentHandFromUser();
    } else {
      let removalCard = this.opponentService.stealPlayerCard(this.userService.getCurrentUserCards());
      console.log(removalCard);
      this.userService.removeCardFromUser(removalCard);
    }

    this.userService.moveCardsFromHandToDeck();
    this.setAndEmitState(GameState.LEAVE_GAME);
  }

  stealOpponentCard(card: CardInfo) {
    //When the player wins they get to steal a card from the opponent. Once the user selects the card
    //it will be sent here where it can then be persisted.
    this.opponentService.removeOpponentCard(card);
    this.userService.moveCardsFromHandToDeck();
    this.userService.addCardToUser(card);

    this.setAndEmitState(GameState.LEAVE_GAME);
  }
}
