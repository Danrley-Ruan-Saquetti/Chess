export type TypePiece = "king" | "queen" | "rook" | "bishop" | "pawn" | "horse"

export type TypeSide = "white" | "black"

export type BoardCoordinates = { x: number, y: number }

export type TypeAcceptableMovePawn = { x: number, y: number, firstMove?: Boolean, attack?: Boolean } | null

export type TypeAcceptableMoveHorse = BoardCoordinates | null

export type TypeAcceptableMoveKing = { x: number, y: number, swap?: Boolean } | null

export type TypePromotion = "queen" | "rook" | "bishop" | "horse"

export type TypeAction = "move" | "death" | "promotion" | "passant"

export type TypeMove = "move" | "swap" | "take" | "check" | "passant" | "promotion" | "checkmate"

export type TypeBoard = (IPiece | null)[][]

export type TypeWinner = TypeSide | null

export type TypeActionArray = {
    type: TypeAction
    piece: IPiece
    position: BoardCoordinates
    target?: BoardCoordinates
    typePromotion?: TypePromotion
    isMain: Boolean
}[]

export interface IAction {
    id: String
    type: TypeAction
    piece: IPiece
    position: BoardCoordinates
    target?: BoardCoordinates
    typePromotion?: TypePromotion
    isMain: Boolean
}

export interface IMove {
    id: String
    type: TypeMove
    actions: IAction[]
}

export interface ILance {
    id: String
    moves: IMove[]
}

export interface IPiece {
    id: String
    type: TypePiece
    side: TypeSide
    isMoved: Boolean
}

export interface IGame {
    id: String
    board: TypeBoard
    sideTime: TypeSide
    historical: ILance[]
    isRunning: Boolean
    winner: TypeWinner
}