import { CardinalDirection } from "./card-types";
import { cardinalDirectionToIndex, getOppositeCardinalDirection } from "./card-util";

describe('Card Util Tests', () => {

    it('cardinalDirectionToIndex works in all cases', () => {
        expect(cardinalDirectionToIndex(CardinalDirection.NW)).toBe(0);
        expect(cardinalDirectionToIndex(CardinalDirection.N)).toBe(1);
        expect(cardinalDirectionToIndex(CardinalDirection.NE)).toBe(2);
        expect(cardinalDirectionToIndex(CardinalDirection.E)).toBe(3);
        expect(cardinalDirectionToIndex(CardinalDirection.SE)).toBe(4);
        expect(cardinalDirectionToIndex(CardinalDirection.S)).toBe(5);
        expect(cardinalDirectionToIndex(CardinalDirection.SW)).toBe(6);
        expect(cardinalDirectionToIndex(CardinalDirection.W)).toBe(7);
    });

    it('getOppositeCardinalDirection works in all cases', () => {
        expect(getOppositeCardinalDirection(CardinalDirection.N)).toBe(CardinalDirection.S);
        expect(getOppositeCardinalDirection(CardinalDirection.S)).toBe(CardinalDirection.N);

        expect(getOppositeCardinalDirection(CardinalDirection.NW)).toBe(CardinalDirection.SE);
        expect(getOppositeCardinalDirection(CardinalDirection.SE)).toBe(CardinalDirection.NW);

        expect(getOppositeCardinalDirection(CardinalDirection.NE)).toBe(CardinalDirection.SW);
        expect(getOppositeCardinalDirection(CardinalDirection.SW)).toBe(CardinalDirection.NE);

        expect(getOppositeCardinalDirection(CardinalDirection.E)).toBe(CardinalDirection.W);
        expect(getOppositeCardinalDirection(CardinalDirection.W)).toBe(CardinalDirection.E);
    });
});