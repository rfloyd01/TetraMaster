import { Injectable } from '@angular/core';
import { AttackStyle, CardDisplay, CardinalDirection, CardInfo, CardStats } from '../util/card-types';
import { cardinalDirectionNeighbor, cardinalDirectionToIndex, getOppositeCardinalDirection, ORDERED_CARDINAL_DIRECTIONS, randomInteger, removeCardFromHandById } from '../util/card-util';
import { CARD_TIMER_INITIAL_DISPLAY, CARD_TIMER_LENGTH } from '../components/card/card';

@Injectable({
  providedIn: 'root'
})
export class Gameplay {
  //This service implements logic for controlling a game. Card battles,
  //assigning

  opponentsTurn(oppenentsCards: CardInfo[], gameBoard: CardInfo[], opponentLevel: number): void {
    //This method holds the logic for making the opponent's move. What the opponent does with 
    //their turn will be a factor of the cards that they have, the cards currently on the board,
    //and the selected skill level of the opponent.
    if (opponentLevel == -1) {
      return this.randomizeOpponentsTurn(oppenentsCards, gameBoard);
    }
  }

  randomizeOpponentsTurn(oppentsCards: CardInfo[], gameBoard: CardInfo[]) {
    //The easiest mode to implement, there is no logic behind the opponent's moves, they simply
    //play a random card in a random location of the board, regardless of arrow configurations
    //or card stats.

    //First pick a random card for the opponent
    const playCard = oppentsCards[randomInteger(oppentsCards.length)];

    //Next pick a random open slot on the board. Make this step easier
    //by first filtering out all non-empty spaces.
    const emptySpaces = gameBoard.filter(space => space.cardDisplay == CardDisplay.EMPTY);
    let playSpace = emptySpaces[randomInteger(emptySpaces.length)];

    //Finally, update the space with the selected card's info and remove the 
    //card from the opponent's hand
    playSpace.cardDisplay = CardDisplay.ENEMY;
    playSpace.cardStats = playCard.cardStats;
    removeCardFromHandById(playCard.id, oppentsCards);

    this.initiateCardBattles(playSpace, gameBoard);
  }

  initiateCardBattles(battleCard: CardInfo, board: CardInfo[], actionArray?:(string | null)[]): number {
    //When a card is placed on the board, if one of its arrows faces a card from the 
    //other player then a card battle will be initiated. If the opposing card doesn't
    //have a reciprical arrow pointing at the new card, then the opposing card will be 
    //caputred without a fight. If the opposing card does have a reciprical arrow though
    //a battle will take place between the two cards, with the victor capturing the other
    //card (and potentially chaining this into other cards).

    //First create an array representing the 8 cardinal directions around the placed card.
    //If there are opposing cards in that spot relative to the new card then a reference will
    //be added to this array.
    if (!actionArray) {
      actionArray = this.generateActionArray(battleCard, board, false);
    }

    //If there is a single battle in the action array then carry it out, if there are multiple battles
    //the player gets to decide which battle to start first.
    let battleCount = actionArray.filter(item => item === 'battle').length;
    if (battleCount == 1) {
      //Carry out the single battle
      const defendingCardDirection = ORDERED_CARDINAL_DIRECTIONS[actionArray.indexOf('battle')];
      let defendingCard = board[battleCard.id + cardinalDirectionNeighbor(defendingCardDirection)];

      if (this.handleCardBattle(battleCard, defendingCard) == battleCard.id) {
        //The attacking card has won, initiate a chain to steal any enemy cards that are touching
        //arrows of the defending card
        defendingCard.cardDisplay = battleCard.cardDisplay;
        let chainedCards = this.generateActionArray(defendingCard, board, true);
        this.captureDefenselessCards(defendingCard, chainedCards, board);
      } else {
        //The attacking card has lost, convert it to the other team and return from this method
        battleCard.cardDisplay = defendingCard.cardDisplay;
        return 0;
      }

    } else if (battleCount >= 1) {
      //Put text into each of the potential battle cards that says "Choose a Card" to alert the
      //player that they get to choose which card to battle. Return false from this method to indicate
      //that we're still in the battle phase
      for (let i:number = 0; i < 8; i++) {
        if (actionArray[i] == 'battle') {
          board[battleCard.id + cardinalDirectionNeighbor(ORDERED_CARDINAL_DIRECTIONS[i])].cardText = 'Select a Card';
        }
      }
      return -1;
    }

    //Once all battles are complete, any cards listed as 'capture' in the action array
    //should switch to the other team.
    this.captureDefenselessCards(battleCard, actionArray, board);

    return 1;
  }

  generateActionArray(battleCard: CardInfo, board: CardInfo[], chain: boolean) {
    let actionArray: (string | null)[] = [null, null, null, null, null, null, null, null]; //TODO: Consider using enum here

    //TODO: Instead of iterating over all directions, iterate over directions based on location
    //of current card (i.e. a card in top left corner will not check anything above or to the left)
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
          actionArray[cardinalDirectionToIndex(direction)] = 'battle'; //TODO: Consider using enum here
        } else {
          actionArray[cardinalDirectionToIndex(direction)] = 'capture'; //TODO: Consider using enum here
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
    // setTimeout(() => {
      
    // }, CARD_TIMER_LENGTH  + CARD_TIMER_INITIAL_DISPLAY + 100); //delay this update until after timer is complete

    this.startTimer(attackingCard, attackingCard.cardStats.attackPower, attackDiff);
    this.startTimer(defendingCard, defense, defenseDiff);


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

  startTimer(card: CardInfo, upperBound: number, lowerBound: number) {
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
