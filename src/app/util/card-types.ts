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
    //Holds info about specific cards on the game board / home screen
    compositeId: CardId;
    cardStats: CardStats;
    isSelected: boolean;
    cardDisplay: CardDisplay;
    cardText: string;
}

export interface CardType {
    //Holds general info about a specific card type, such as the name of the card
    //and a range for possible stats. This interface is used mainly
    //in card creation.
    id: number; //refers to location on card selection grid (i.e. Goblin = 0, Cactuar = 23...)
    name: string;
    attackStyle: AttackStyle;
    maxAtt: number;
    maxPDef: number;
    maxMDef: number;
}

export interface CardId {
    //There are multiple different ids that can be tied to a single card so this
    //class acts as a composite id to help keep track of everything about the card
    boardLocation: number; //where the card currently is on the gameboard
    userSlot: number; //where the card started in either users hand (100-104 for opponent and 105-109 for player)
    uniqueId?: number; //used to differentiate cards owned by the player (matches database id for a given card)
    cardTypeId: number; //tells what kind of card it is
}

//Interface for receiving user card info from back end
export interface UserCardJson {
    card_id?: number;
    card_type: number;
    arrows: number;
    attack_power: number;
    attack_style: string;
    physical_defense: number;
    magical_defense: number;
}

//Interface for receiving user info from back end
export interface UserJson {
    jwt?: string;
    user_id: number;
    username: string;
    enc_password: string;
    cards: UserCardJson[];
}

//Holds info about user that the front end can use
export interface User {
    username: string;
    cards: CardInfo[][][];
}

//Array holding CardType info for every card in the game
export const CARD_TYPES:CardType[] = [
    {id: 0, name: 'Goblin', attackStyle: AttackStyle.PHYSICAL, maxAtt: 7, maxPDef: 9, maxMDef: 4},
    {id: 1, name: 'Fang', attackStyle: AttackStyle.PHYSICAL, maxAtt: 9, maxPDef: 10, maxMDef: 4},
    {id: 2, name: 'Skeleton', attackStyle: AttackStyle.PHYSICAL, maxAtt: 11, maxPDef: 12, maxMDef: 10},
    {id: 3, name: 'Flan', attackStyle: AttackStyle.MAGICAL, maxAtt: 13, maxPDef: 6, maxMDef: 19},
    {id: 4, name: 'Zaghnol', attackStyle: AttackStyle.PHYSICAL, maxAtt: 15, maxPDef: 13, maxMDef: 13},
    {id: 5, name: 'Lizard Man', attackStyle: AttackStyle.PHYSICAL, maxAtt: 17, maxPDef: 15, maxMDef: 8},
    {id: 6, name: 'Zombie', attackStyle: AttackStyle.PHYSICAL, maxAtt: 19, maxPDef: 19, maxMDef: 11},
    {id: 7, name: 'Bomb', attackStyle: AttackStyle.MAGICAL, maxAtt: 21, maxPDef: 12, maxMDef: 21},
    {id: 8, name: 'Ironite', attackStyle: AttackStyle.PHYSICAL, maxAtt: 23, maxPDef: 23, maxMDef: 13},
    {id: 9, name: 'Sahagin', attackStyle: AttackStyle.PHYSICAL, maxAtt: 25, maxPDef: 18, maxMDef: 4},
    {id: 10, name: 'Yeti', attackStyle: AttackStyle.MAGICAL, maxAtt: 27, maxPDef: 6, maxMDef: 26},
    {id: 11, name: 'Mimic', attackStyle: AttackStyle.MAGICAL, maxAtt: 29, maxPDef: 20, maxMDef: 27},
    {id: 12, name: 'Wyerd', attackStyle: AttackStyle.MAGICAL, maxAtt: 31, maxPDef: 9, maxMDef: 33},
    {id: 13, name: 'Mandragora', attackStyle: AttackStyle.MAGICAL, maxAtt: 33, maxPDef: 15, maxMDef: 39},
    {id: 14, name: 'Crawler', attackStyle: AttackStyle.PHYSICAL, maxAtt: 35, maxPDef: 36, maxMDef: 8},
    {id: 15, name: 'Sand Scorpion', attackStyle: AttackStyle.PHYSICAL, maxAtt: 37, maxPDef: 37, maxMDef: 17},
    {id: 16, name: 'Nymph', attackStyle: AttackStyle.MAGICAL, maxAtt: 39, maxPDef: 12, maxMDef: 38},
    {id: 17, name: 'Sand Golem', attackStyle: AttackStyle.PHYSICAL, maxAtt: 41, maxPDef: 38, maxMDef: 16},
    {id: 18, name: 'Zuu', attackStyle: AttackStyle.PHYSICAL, maxAtt: 43, maxPDef: 11, maxMDef: 34},
    {id: 19, name: 'Dragonfly', attackStyle: AttackStyle.PHYSICAL, maxAtt: 45, maxPDef: 40, maxMDef: 19},
    {id: 20, name: 'Carrion Worm', attackStyle: AttackStyle.MAGICAL, maxAtt: 47, maxPDef: 29, maxMDef: 25},
    {id: 21, name: 'Cerberus', attackStyle: AttackStyle.PHYSICAL, maxAtt: 49, maxPDef: 45, maxMDef: 4},
    {id: 22, name: 'Antlion', attackStyle: AttackStyle.PHYSICAL, maxAtt: 51, maxPDef: 48, maxMDef: 27},
    {id: 23, name: 'Cactuar', attackStyle: AttackStyle.PHYSICAL, maxAtt: 53, maxPDef: 195, maxMDef: 4},
    {id: 24, name: 'Gimme Cat', attackStyle: AttackStyle.MAGICAL, maxAtt: 55, maxPDef: 33, maxMDef: 29},
    {id: 25, name: 'Ragtimer', attackStyle: AttackStyle.MAGICAL, maxAtt: 57, maxPDef: 34, maxMDef: 30},
    {id: 26, name: 'Hedgehog Pie', attackStyle: AttackStyle.MAGICAL, maxAtt: 59, maxPDef: 22, maxMDef: 40},
    {id: 27, name: 'Ralvuimahgo', attackStyle: AttackStyle.PHYSICAL, maxAtt: 61, maxPDef: 68, maxMDef: 12},
    {id: 28, name: 'Ochu', attackStyle: AttackStyle.PHYSICAL, maxAtt: 63, maxPDef: 37, maxMDef: 18},
    {id: 29, name: 'Troll', attackStyle: AttackStyle.PHYSICAL, maxAtt: 65, maxPDef: 62, maxMDef: 34},
    {id: 30, name: 'Blazer Beetle', attackStyle: AttackStyle.PHYSICAL, maxAtt: 67, maxPDef: 91, maxMDef: 18},
    {id: 31, name: 'Abomination', attackStyle: AttackStyle.PHYSICAL, maxAtt: 69, maxPDef: 59, maxMDef: 58},
    {id: 32, name: 'Zemzelett', attackStyle: AttackStyle.MAGICAL, maxAtt: 71, maxPDef: 32, maxMDef: 96},
    {id: 33, name: 'Stroper', attackStyle: AttackStyle.PHYSICAL, maxAtt: 73, maxPDef: 64, maxMDef: 8},
    {id: 34, name: 'Tantarian', attackStyle: AttackStyle.MAGICAL, maxAtt: 75, maxPDef: 43, maxMDef: 39},
    {id: 35, name: 'Grand Dragon', attackStyle: AttackStyle.PHYSICAL, maxAtt: 77, maxPDef: 65, maxMDef: 71},
    {id: 36, name: 'Feather Circle', attackStyle: AttackStyle.MAGICAL, maxAtt: 79, maxPDef: 45, maxMDef: 41},
    {id: 37, name: 'Hecteyes', attackStyle: AttackStyle.MAGICAL, maxAtt: 81, maxPDef: 10, maxMDef: 70},
    {id: 38, name: 'Ogre', attackStyle: AttackStyle.PHYSICAL, maxAtt: 83, maxPDef: 80, maxMDef: 29},
    {id: 39, name: 'Armstrong', attackStyle: AttackStyle.MAGICAL, maxAtt: 85, maxPDef: 36, maxMDef: 75},
    {id: 40, name: 'Ash', attackStyle: AttackStyle.MAGICAL, maxAtt: 87, maxPDef: 50, maxMDef: 50},
    {id: 41, name: 'Wraith', attackStyle: AttackStyle.MAGICAL, maxAtt: 89, maxPDef: 80, maxMDef: 17},
    {id: 42, name: 'Gargoyle', attackStyle: AttackStyle.MAGICAL, maxAtt: 91, maxPDef: 51, maxMDef: 47},
    {id: 43, name: 'Vepal', attackStyle: AttackStyle.MAGICAL, maxAtt: 93, maxPDef: 52, maxMDef: 48},
    {id: 44, name: 'Grimlock', attackStyle: AttackStyle.MAGICAL, maxAtt: 84, maxPDef: 37, maxMDef: 54},
    {id: 45, name: 'Tonberry', attackStyle: AttackStyle.PHYSICAL, maxAtt: 41, maxPDef: 54, maxMDef: 50},
    {id: 46, name: 'Veteran', attackStyle: AttackStyle.MAGICAL, maxAtt: 90, maxPDef: 30, maxMDef: 145},
    {id: 47, name: 'Garuda', attackStyle: AttackStyle.MAGICAL, maxAtt: 98, maxPDef: 72, maxMDef: 29},
    {id: 48, name: 'Malboro', attackStyle: AttackStyle.MAGICAL, maxAtt: 86, maxPDef: 57, maxMDef: 99},
    {id: 49, name: 'Mover', attackStyle: AttackStyle.MAGICAL, maxAtt: 102, maxPDef: 250, maxMDef: 8},
    {id: 50, name: 'Abadon', attackStyle: AttackStyle.MAGICAL, maxAtt: 125, maxPDef: 105, maxMDef: 45},
    {id: 51, name: 'Behemoth', attackStyle: AttackStyle.PHYSICAL, maxAtt: 189, maxPDef: 71, maxMDef: 106},
    {id: 52, name: 'Iron Man', attackStyle: AttackStyle.PHYSICAL, maxAtt: 197, maxPDef: 110, maxMDef: 12},
    {id: 53, name: 'Nova Dragon', attackStyle: AttackStyle.PHYSICAL, maxAtt: 236, maxPDef: 125, maxMDef: 194},
    {id: 54, name: 'Ozma', attackStyle: AttackStyle.PHYSICAL, maxAtt: 221, maxPDef: 6, maxMDef: 199},
    {id: 55, name: 'Hades', attackStyle: AttackStyle.MAGICAL, maxAtt: 250, maxPDef: 200, maxMDef: 20},
    {id: 56, name: 'Holy', attackStyle: AttackStyle.MAGICAL, maxAtt: 134, maxPDef: 40, maxMDef: 63},
    {id: 57, name: 'Meteor', attackStyle: AttackStyle.MAGICAL, maxAtt: 190, maxPDef: 162, maxMDef: 2},
    {id: 58, name: 'Flare', attackStyle: AttackStyle.MAGICAL, maxAtt: 208, maxPDef: 17, maxMDef: 17},
    {id: 59, name: 'Shiva', attackStyle: AttackStyle.MAGICAL, maxAtt: 83, maxPDef: 6, maxMDef: 95},
    {id: 60, name: 'Ifrit', attackStyle: AttackStyle.MAGICAL, maxAtt: 100, maxPDef: 150, maxMDef: 17},
    {id: 61, name: 'Ramuh', attackStyle: AttackStyle.MAGICAL, maxAtt: 74, maxPDef: 29, maxMDef: 103},
    {id: 62, name: 'Atomos', attackStyle: AttackStyle.MAGICAL, maxAtt: 66, maxPDef: 100, maxMDef: 100},
    {id: 63, name: 'Odin', attackStyle: AttackStyle.MAGICAL, maxAtt: 205, maxPDef: 136, maxMDef: 72},
    {id: 64, name: 'Leviathan', attackStyle: AttackStyle.MAGICAL, maxAtt: 183, maxPDef: 100, maxMDef: 22},
    {id: 65, name: 'Bahamut', attackStyle: AttackStyle.MAGICAL, maxAtt: 200, maxPDef: 145, maxMDef: 83},
    {id: 66, name: 'Ark', attackStyle: AttackStyle.MAGICAL, maxAtt: 226, maxPDef: 96, maxMDef: 90},
    {id: 67, name: 'Fenrir', attackStyle: AttackStyle.MAGICAL, maxAtt: 139, maxPDef: 36, maxMDef: 22},
    {id: 68, name: 'Madeen', attackStyle: AttackStyle.MAGICAL, maxAtt: 162, maxPDef: 22, maxMDef: 100},
    {id: 69, name: 'Alexander', attackStyle: AttackStyle.MAGICAL, maxAtt: 225, maxPDef: 183, maxMDef: 86},
    {id: 70, name: 'Excalibur II', attackStyle: AttackStyle.PHYSICAL, maxAtt: 255, maxPDef: 180, maxMDef: 6},
    {id: 71, name: 'Ultima Weapon', attackStyle: AttackStyle.PHYSICAL, maxAtt: 248, maxPDef: 24, maxMDef: 102},
    {id: 72, name: 'Masamune', attackStyle: AttackStyle.PHYSICAL, maxAtt: 202, maxPDef: 180, maxMDef: 56},
    {id: 73, name: 'Elixir', attackStyle: AttackStyle.MAGICAL, maxAtt: 100, maxPDef: 100, maxMDef: 100},
    {id: 74, name: 'Dark Matter', attackStyle: AttackStyle.MAGICAL, maxAtt: 199, maxPDef: 56, maxMDef: 195},
    {id: 75, name: 'Ribbon', attackStyle: AttackStyle.MAGICAL, maxAtt: 12, maxPDef: 200, maxMDef: 255},
    {id: 76, name: 'Tiger Racket', attackStyle: AttackStyle.PHYSICAL, maxAtt: 12, maxPDef: 5, maxMDef: 19},
    {id: 77, name: 'Save the Queen', attackStyle: AttackStyle.PHYSICAL, maxAtt: 112, maxPDef: 60, maxMDef: 10},
    {id: 78, name: 'Genji', attackStyle: AttackStyle.PHYSICAL, maxAtt: 10, maxPDef: 105, maxMDef: 175},
    {id: 79, name: 'Mythril Sword', attackStyle: AttackStyle.PHYSICAL, maxAtt: 32, maxPDef: 4, maxMDef: 6},
    {id: 80, name: 'Blue Narciss', attackStyle: AttackStyle.PHYSICAL, maxAtt: 143, maxPDef: 144, maxMDef: 20},
    {id: 81, name: 'Hilda Garde 3', attackStyle: AttackStyle.PHYSICAL, maxAtt: 98, maxPDef: 62, maxMDef: 16},
    {id: 82, name: 'Invincible', attackStyle: AttackStyle.MAGICAL, maxAtt: 185, maxPDef: 145, maxMDef: 201},
    {id: 83, name: 'Cargo Ship', attackStyle: AttackStyle.PHYSICAL, maxAtt: 45, maxPDef: 100, maxMDef: 10},
    {id: 84, name: 'Hilda Garde 1', attackStyle: AttackStyle.PHYSICAL, maxAtt: 99, maxPDef: 75, maxMDef: 2},
    {id: 85, name: 'Red Rose', attackStyle: AttackStyle.PHYSICAL, maxAtt: 143, maxPDef: 20, maxMDef: 144},
    {id: 86, name: 'Theater Ship', attackStyle: AttackStyle.PHYSICAL, maxAtt: 33, maxPDef: 106, maxMDef: 19},
    {id: 87, name: 'Viltgance', attackStyle: AttackStyle.PHYSICAL, maxAtt: 228, maxPDef: 145, maxMDef: 32},
    {id: 88, name: 'Chocobo', attackStyle: AttackStyle.PHYSICAL, maxAtt: 3, maxPDef: 5, maxMDef: 12},
    {id: 89, name: 'Fat Chocobo', attackStyle: AttackStyle.PHYSICAL, maxAtt: 25, maxPDef: 30, maxMDef: 30},
    {id: 90, name: 'Mog', attackStyle: AttackStyle.MAGICAL, maxAtt: 3, maxPDef: 5, maxMDef: 12},
    {id: 91, name: 'Frog', attackStyle: AttackStyle.PHYSICAL, maxAtt: 2, maxPDef: 2, maxMDef: 2},
    {id: 92, name: 'Oglop', attackStyle: AttackStyle.PHYSICAL, maxAtt: 40, maxPDef: 33, maxMDef: 6},
    {id: 93, name: 'Alexandria', attackStyle: AttackStyle.PHYSICAL, maxAtt: 4, maxPDef: 178, maxMDef: 100},
    {id: 94, name: 'Lindblum', attackStyle: AttackStyle.PHYSICAL, maxAtt: 6, maxPDef: 100, maxMDef: 178},
    {id: 95, name: 'Two Moons', attackStyle: AttackStyle.MAGICAL, maxAtt: 113, maxPDef: 88, maxMDef: 88},
    {id: 96, name: 'Gargant', attackStyle: AttackStyle.PHYSICAL, maxAtt: 46, maxPDef: 17, maxMDef: 56},
    {id: 97, name: 'Namingway', attackStyle: AttackStyle.MAGICAL, maxAtt: 127, maxPDef: 127, maxMDef: 127},
    {id: 98, name: 'Boco', attackStyle: AttackStyle.PHYSICAL, maxAtt: 128, maxPDef: 127, maxMDef: 127},
    {id: 99, name: 'Airship', attackStyle: AttackStyle.PHYSICAL, maxAtt: 129, maxPDef: 127, maxMDef: 127}
];