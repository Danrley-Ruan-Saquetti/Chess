const ACCEPTABLE_MOVES_HORSE = [
    { x: 1, y: 2 },
    { x: 1, y: -2 },
    { x: -1, y: 2 },
    { x: -1, y: -2 },
    { x: 2, y: 1 },
    { x: -2, y: 1 },
    { x: 2, y: -1 },
    { x: -2, y: -1 },
];
const ACCEPTABLE_MOVES_KING = [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 2, swap: true },
    { x: 0, y: -2, swap: true },
];
export const RULE_PIECES = {
    acceptableMoves: {
        king: {
            white: ACCEPTABLE_MOVES_KING,
            black: ACCEPTABLE_MOVES_KING,
        },
        queen: {
            white: [],
            black: [],
        },
        rook: {
            white: [],
            black: [],
        },
        bishop: {
            white: [],
            black: [],
        },
        pawn: {
            white: [
                { x: -1, y: 0 },
                { x: -2, y: 0, firstMove: true },
                { x: -1, y: -1, attack: true },
                { x: -1, y: 1, attack: true },
            ],
            black: [
                { x: 1, y: 0 },
                { x: 2, y: 0, firstMove: true },
                { x: 1, y: -1, attack: true },
                { x: 1, y: 1, attack: true },
            ],
        },
        horse: {
            white: ACCEPTABLE_MOVES_HORSE,
            black: ACCEPTABLE_MOVES_HORSE,
        }
    }
};
export const SIZE_BOARD = {
    rows: 8,
    columns: 8
};
export const POSITION_INITIAL = [
    { type: "pawn", positions: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 1, y: 5 }, { x: 1, y: 6 }, { x: 1, y: 7 }] },
    { type: "rook", positions: [{ x: 0, y: 0 }, { x: 0, y: SIZE_BOARD.columns - 1 }] },
    { type: "horse", positions: [{ x: 0, y: 1 }, { x: 0, y: SIZE_BOARD.columns - 2 }] },
    { type: "bishop", positions: [{ x: 0, y: 2 }, { x: 0, y: SIZE_BOARD.columns - 3 }] },
    { type: "queen", positions: [{ x: 0, y: 3 }] },
    { type: "king", positions: [{ x: 0, y: 4 }] },
];
export const ALL_DIRECTIONS = [{ x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
