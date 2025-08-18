import { AttackStyle, CardinalDirection, CardInfo, CardType } from "./card-types";

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

export function removeCardFromHandByUserSlotId(id: number, hand: CardInfo[]) {
    const index = hand.findIndex(item => item.compositeId.userSlot === id);
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

export function createDefaultStats() {
    return createStats(0, 0, AttackStyle.PHYSICAL, 0, 0);
}

export function createDefaultStatsWithRandomArrows() {
    return createStats(randomInteger(256), 0, AttackStyle.PHYSICAL, 0, 0);
}

export function createRandomStats() {
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

    return createStats(randomInteger(256), randomInteger(256), attackStyle, randomInteger(256), randomInteger(256));
}

export function createRandomStatsForCardType(cardType: CardType) {
    //Similar to the createRandomStats() method, however, the values generated will be within the 
    //acceptable range for the specific card type. For example, a goblin card has a maximum
    //attack of 7 while the Nova Dragon card has a max attack of 236. The actual value generated
    //for each stat will be somewhere between the max value for the card type, and half the max value.
    const arrows = randomInteger(256);
    const attack = randomInteger(cardType.maxAtt + 1, Math.floor(cardType.maxAtt / 2));
    const pDef = randomInteger(cardType.maxPDef + 1, Math.floor(cardType.maxPDef / 2));
    const mDef = randomInteger(cardType.maxMDef + 1, Math.floor(cardType.maxMDef / 2));
    
    return createStats(arrows, attack, cardType.attackStyle, pDef, mDef);
}

export function createStats(activeArrows: number, attackPower: number, attackStyle: AttackStyle,
    physicalDefense:number, magicalDefense: number) {
    return {
        activeArrows: activeArrows,
        attackPower: attackPower,
        attackStyle: attackStyle,
        physicalDefense: physicalDefense,
        magicalDefense: magicalDefense
    }
}