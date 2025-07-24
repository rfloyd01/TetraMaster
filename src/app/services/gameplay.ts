import { Injectable } from '@angular/core';
import { CardDisplay, CardInfo } from '../util/card-types';
import { removeCardFromHandById } from '../util/card-util';

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
  }
}
