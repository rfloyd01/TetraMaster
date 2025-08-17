import { Injectable } from '@angular/core';
import { Opponent } from '../util/gameplay-types';
import { CARD_TYPES, CardDisplay, CardInfo } from '../util/card-types';
import { createRandomStatsForCardType, randomInteger } from '../util/card-util';
import { generateActionArray } from '../util/gameplay-utils';

@Injectable({
  providedIn: 'root'
})
export class OpponentService {
  opponent!: Opponent;
  opponentCards!: CardInfo[];
  sliderMovement: number = 48.0 / 64.0;

  //Imports
  ALL_CARD_TYPES = CARD_TYPES;

  setOpponent(opponent:Opponent) {
    this.opponent = opponent;
  }

  getOpponentCards() {
    return this.opponentCards;
  }

  addOpponentCard(card: CardInfo) {
    //Add the given card to the opponent's hand
    this.opponentCards.push(card);
  }

  generateOpponentCards() {
    //Generate cards for the opponent based on their card level. Per the TetraMaster
    //wiki, opponents have 16 cards in their deck where the same card can be in the 
    //deck multiple times. The wiki also states that there are 64 different decks in
    //the game and 128 different players.

    //There are 100 different cards that are more or less in ascending order of strength
    //(with the exception of the specialty cards at the very end). In the game, no doubt
    //all of these decks are hardcoded, but I'll do something different here. If you
    //imagine all cards lined up in a row, the opponent's card level will represent a 
    //sliding window along this line where the oponnent will only use cards within the
    //window.

    //At the least, it makes sense to do this for the monster cards (first 56 cards) as
    //they get progresively stronger. The rest of the cards are a bit of a mixed bag though
    //so I'll implement logic to randomly though in cards from 57-100 into opponent hands.
    //Since I want to maintain the original 64 different decks mentality I'll use a sliding
    //window of size 8 (8 goes into both 56 and 64).

    //First, set the beast card window based on the opponent's card level
    const cardLevel = this.opponent.cardLevel;
    const minCard = Math.floor(cardLevel * this.sliderMovement);
    const maxCard = minCard + 7;

    //Pick 5 cards randomly within the given range.
    let cardIndices: number[] = [];
    for (let i:number = 0; i < 5; i++) {
      cardIndices.push(randomInteger(maxCard, minCard));
    }

    //TODO: Add some logic that will let certain opponent card levels (maybe every 8th level?)
    // have a chance to pick a rare card and replace one of the already selected cards with it.
    // The rare cards will be based on the level (i.e. level 8 will have a range of maybe 3 rare
    // cards to choose from, level 16 the next three rare cards, etc.)

    //Create random cards based on the card indices drawn
    this.opponentCards = []; //reset current cards
    let id:number = 100;
    for (let cardIndex of cardIndices) {
      this.opponentCards.push(
      {
        compositeId: {
          boardLocation: 0,
          uniqueId: 0,
          userSlot: id++,
          cardTypeId: cardIndex
        },
        cardStats: createRandomStatsForCardType(this.ALL_CARD_TYPES[cardIndex]),
        isSelected: false,
        cardDisplay: CardDisplay.BACK,
        cardText: ''
      });
    }
  }

  makeMove(gameBoard: CardInfo[]): {card: CardInfo, location: CardInfo} {
    //This method will decide where the opponent moves based on the cards currently in the
    //opponents hand, the cards on the board, and also the opponent's level. The return type
    //of this method contains the card the opponent chooses to play, as well as the physical
    //card on the board where they are going to play.
    switch (this.opponent.skillLevel) {
      case 0: return this.levelZeroMove(gameBoard);
      case 1: return this.levelOneMove(gameBoard);
    }

    return {card: this.opponentCards[0], location: gameBoard[0]};
  }

  levelZeroMove(gameBoard: CardInfo[]): {card: CardInfo, location: CardInfo} {
    //When the opponent has skill level 0, they simply play a random card in a random location
    //of the board, regardless of arrow configurations or card stats.
    console.log('Making a level 0 opponent move');

    //First pick a random card for the opponent
    const playCard = this.opponentCards[randomInteger(this.opponentCards.length)];

    //Next pick a random open slot on the board. Make this step easier
    //by first filtering out all non-empty spaces.
    const emptySpaces = gameBoard.filter(space => space.cardDisplay == CardDisplay.EMPTY);
    let playSpace = emptySpaces[randomInteger(emptySpaces.length)];

    //Return the selected card and board location
    return {card: playCard, location: playSpace};
  }

  levelOneMove(gameBoard: CardInfo[]): {card: CardInfo, location: CardInfo} {
    //The level one opponent will prioritze trying to take cards without a fight. If there's no
    //where on the board they can move and easily take a card then they'll try to move somewhere
    //where no battle will take place. If that's not possible, they'll then just pick a random
    //spot on the board.
    console.log('Making a level 1 opponent move');

    //Step 0: Get list of empty spaces where the opponent can actually play
    const emptySpaces = gameBoard.filter(space => space.cardDisplay == CardDisplay.EMPTY);
    let nonBattleOptions:{card: CardInfo, location: CardInfo}[] = [];

    //Step 1: Try to pick a spot where an opponent card can be take without a fight. Nothing
    // fancy here, just a brute force check
    for (let space of emptySpaces) {
      for (let opponentCard of this.opponentCards) {
        try {
          let actionArray = generateActionArray(opponentCard.cardStats, space.compositeId.boardLocation, CardDisplay.ENEMY, gameBoard, false);

          if (actionArray.includes('battle')) {
            //If a battle will arise then don't place a card here
            continue;
          } else if (actionArray.includes('capture')) {
            //We can capture at least one card without a fight so place the current 
            //card in this location
            return {card: opponentCard, location: space};
          } else {
            //There's no battle or capture event here which is fine, add the spot to 
            //the list of non-battle spots for future reference
            nonBattleOptions.push({card: opponentCard, location: space});
          }
        } catch (error) {
          console.log(error);
        }
        
      }
    }

    //Step 2: Move to a location where no battle will occur
    if (nonBattleOptions.length > 0) {
      return nonBattleOptions[randomInteger(nonBattleOptions.length)];
    }

    //Step 3: If a move still hasn't been made then pick a random spot
    return this.levelZeroMove(gameBoard);
  }

}
