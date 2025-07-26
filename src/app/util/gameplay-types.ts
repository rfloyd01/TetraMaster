export enum GameState {
    GAME_START = 0,
    PLAYER_TURN = 1, 
    OPPONENT_TURN = 2,
    PLAYER_SELECT_BATTLE = 3,
    GAME_END = 4
}

export enum BattleResult {
    ERROR,
    NEED_PLAYER_INPUT,
    NO_BATTLE,
    LOST_BATTLE,
    WON_BATTLE
}