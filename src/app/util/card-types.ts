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

export interface CardStats {
    activeArrows: number; //8 bit number representing the arrows on the card
    attackPower: number;
    attackStyle: AttackStyle;
    physicalDefense: number;
    magicalDefense: number;
}

export interface CardInfo {
    cardStats: CardStats;
    isSelected: boolean;
    cardDisplay: CardDisplay;
}