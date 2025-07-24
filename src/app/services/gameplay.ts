import { Injectable } from '@angular/core';
import { CardDisplay, CardinalDirection, CardInfo } from '../util/card-types';
import { cardinalDirectionNeighbor, cardinalDirectionToIndex, getOppositeCardinalDirection, ORDERED_CARDINAL_DIRECTIONS, removeCardFromHandById } from '../util/card-util';

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
    const playCard = oppentsCards[Math.floor(Math.random() * oppentsCards.length)];

    //Next pick a random open slot on the board. Make this step easier
    //by first filtering out all non-empty spaces.
    const emptySpaces = gameBoard.filter(space => space.cardDisplay == CardDisplay.EMPTY);
    let playSpace = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];

    //Finally, update the space with the selected card's info and remove the 
    //card from the opponent's hand
    playSpace.cardDisplay = CardDisplay.ENEMY;
    playSpace.cardStats = playCard.cardStats;
    removeCardFromHandById(playCard.id, oppentsCards);

    this.initiateCardBattles(playSpace, gameBoard);
  }

  initiateCardBattles(battleCard: CardInfo, board: CardInfo[]) {
    //When a card is placed on the board, if one of its arrows faces a card from the 
    //other player then a card battle will be initiated. If the opposing card doesn't
    //have a reciprical arrow pointing at the new card, then the opposing card will be 
    //caputred without a fight. If the opposing card does have a reciprical arrow though
    //a battle will take place between the two cards, with the victor capturing the other
    //card (and potentially chaining this into other cards).

    //First create an array representing the 8 cardinal directions around the placed card.
    //If there are opposing cards in that spot relative to the new card then a reference will
    //be added to this array.
    let actionArray = this.generateActionArray(battleCard, board);

    //If there is a single battle in the action array then carry it out, if there are multiple battles
    //the player gets to decide which battle to start first.
    //TODO: Implement battle loop

    //Once all battles are complete, any cards listed as 'capture' in the action array
    //should switch to the other team.
    for (let cardinalDirection of ORDERED_CARDINAL_DIRECTIONS) {
      if (actionArray[cardinalDirectionToIndex(cardinalDirection)] == 'capture') {
        board[battleCard.id + cardinalDirectionNeighbor(cardinalDirection)].cardDisplay = battleCard.cardDisplay;
      }
    }
  }

  generateActionArray(battleCard: CardInfo, board: CardInfo[]) {
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
        if (neighboringCard.cardStats.activeArrows & opposingArrowDirection) {
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
}
