import { CardInfo } from "./card-types";

export function removeCardFromHandById(id: number, hand: CardInfo[]) {
    const index = hand.findIndex(item => item.id === id);
    if (index !== -1) {
        hand.splice(index, 1);
    }
}