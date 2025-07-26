export enum AttackStyle {
    PHYSICAL = 'P',
    MAGICAL = 'M',
    FLEXIBLE = 'X',
    ASSUALT = 'A'
}

export enum CardDisplay {
    FRIEND = 'friend',
    ENEMY = 'enemy',
    EMPTY = 'empty',
    BLOCKED = 'blocked',
    BACK = 'back'
}

//Enum that translates cardinal directions to binary numbers
//for easier bitwise operations
export enum CardinalDirection {
    NW = 0b00000001,
    N  = 0b00000010,
    NE = 0b00000100,
    E  = 0b00001000,
    SE = 0b00010000,
    S  = 0b00100000,
    SW = 0b01000000,
    W  = 0b10000000
}

export interface CardStats {
    activeArrows: number; //8 bit number representing the arrows on the card
    attackPower: number;
    attackStyle: AttackStyle;
    physicalDefense: number;
    magicalDefense: number;
}

export interface CardInfo {
    id: number;
    cardStats: CardStats;
    isSelected: boolean;
    cardDisplay: CardDisplay;
    cardText: string;
}