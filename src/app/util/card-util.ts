import { CardinalDirection, CardInfo } from "./card-types";

export const ORDERED_CARDINAL_DIRECTIONS = [CardinalDirection.NW, CardinalDirection.N, CardinalDirection.NE, CardinalDirection.E,
    CardinalDirection.SE, CardinalDirection.S, CardinalDirection.SW, CardinalDirection.W];

export function removeCardFromHandById(id: number, hand: CardInfo[]) {
    const index = hand.findIndex(item => item.id === id);
    if (index !== -1) {
        hand.splice(index, 1);
    }
}

export function cardinalDirectionToIndex(direction: CardinalDirection) {
    //Could extract this via logs, but this should be quicker
    switch (direction) {
        case CardinalDirection.NW: return 0;
        case CardinalDirection.N:  return 1;
        case CardinalDirection.NE: return 2;
        case CardinalDirection.E:  return 3;
        case CardinalDirection.SE: return 4;
        case CardinalDirection.S:  return 5;
        case CardinalDirection.SW: return 6;
        case CardinalDirection.W:  return 7;
    }
}

export function cardinalDirectionNeighbor(direction: CardinalDirection) {
    //Returns the relative index on the board for a given card based on the
    //cardinal direction it's located from the current card. For example,
    //if card B is directly north of card A, then it will be exactly 4 indices
    //earlier in the board's card array.
    switch (direction) {
        case CardinalDirection.NW: return -5;
        case CardinalDirection.N:  return -4;
        case CardinalDirection.NE: return -3;
        case CardinalDirection.E:  return 1;
        case CardinalDirection.SE: return 5;
        case CardinalDirection.S:  return 4;
        case CardinalDirection.SW: return 3;
        case CardinalDirection.W:  return -1;
    }
}

export function getOppositeCardinalDirection(direction: CardinalDirection): CardinalDirection {
    //Knowing the opposite cardinal direction is helpful for determining battles.
    //Since the opposite direction will always be four slots away from the current
    //direction, we figure out the opposite direction with left or right shifts
    return (direction >= CardinalDirection.SE) ? (direction >> 4) : (direction << 4); 
}