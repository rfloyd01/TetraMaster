import { CardinalDirection, CardInfo } from "./card-types";

export const ORDERED_CARDINAL_DIRECTIONS = [CardinalDirection.NW, CardinalDirection.N, CardinalDirection.NE, CardinalDirection.E,
    CardinalDirection.SE, CardinalDirection.S, CardinalDirection.SW, CardinalDirection.W];

export function randomInteger(ceiling: number, floor?: number, ) {
    //Generates a random integer between the given floor and ceiling.
    if (!floor) {
        floor = 0;
    }

    if (ceiling < floor) {
        console.warn('error generating random number');
        return 0;
    } else if (ceiling == floor) {
        return ceiling;
    }

    //In an attempt to get good, uniform, random numbers the getRandomValues method from the
    //cryptology library is used. Normally to ensure that a random number generated like this
    //is within the supplied range we would modulus divide it. If the supplied range dosn't
    //divide (2^32 - 1) evenly then a uniform distibution won't be possible (i.e. some numbers
    //will never pop up and other numbers will appear more frequently).

    //To fix this problem, find the maximum 32-bit integer that the supplied range will evenly divide 
    //into, and reject any random number that's larger than this limit.
    const range = ceiling - floor;
    const max = Math.floor(0xFFFFFFFF / range) * range;
    const array = new Uint32Array(1);

    let randomNumber: number;
    do {
        crypto.getRandomValues(array);
        randomNumber = array[0];
    } while (randomNumber > max)
    
    return randomNumber % range + floor;
}

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