
import { CardDisplay, CardinalDirection, CardInfo, CardStats } from "./card-types";
import { cardinalDirectionNeighbor, cardinalDirectionToIndex, getOppositeCardinalDirection } from "./card-util";

/*
This class contains methods pertaining to gameplay which are useful for multiple classes
*/

export function generateActionArray(battleCardStats: CardStats, battleCardLocation: number, battleCardDisplay: CardDisplay,
    board: CardInfo[], chain: boolean) {
        let actionArray: (string | null)[] = [null, null, null, null, null, null, null, null];
        Object.keys(CardinalDirection).filter(key => !isNaN(Number(key))).forEach((key) => {
            const direction = Number(key);

            if (battleCardStats.activeArrows & (1 << cardinalDirectionToIndex(direction))) {
                const hasNeighbor = checkForNeighboringCard(battleCardLocation, direction, board,
                battleCardDisplay == CardDisplay.FRIEND ? CardDisplay.ENEMY: CardDisplay.FRIEND);

                if (hasNeighbor) {
                    let neighboringCard = board[battleCardLocation + cardinalDirectionNeighbor(direction)];

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
            }

    });

  return actionArray;
}

export function checkForNeighboringCard(currentCardLocation: number, direction: number, board: CardInfo[], opponentDisplay: CardDisplay): boolean {
  //Before checking for neighbor, first see if the currentCard has an arrow pointing in the given direction
//   if (!(currentCard.cardStats.activeArrows & (1 << cardinalDirectionToIndex(direction)))) {
//     return false;
//   }

  let onUpperEdge: boolean = (currentCardLocation < 4);
  let onRightEdge: boolean = (currentCardLocation % 4 == 3);
  let onLowerEdge: boolean = (currentCardLocation >= 12);
  let onLeftEdge:  boolean = (currentCardLocation % 4 == 0);
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

  return neighborsOk && (board[currentCardLocation + cardinalDirectionNeighbor(direction)].cardDisplay == opponentDisplay);
}