import { BoardCoordinates, TypeActionArray, TypeBoard, TypeMove, TypePromotion, TypeSide, TypeWinner } from "../model/model-game"
import dataGame from "../data/data-game.js";
import BoardControl from "./control-board.js";
import HistoryControl from "./control-history.js";
import PieceControl from "./control-piece.js";

export default function GameControl() {
    const boardControl = BoardControl()
    const historyControl = HistoryControl()
    const pieceControl = PieceControl()

    const startGame = () => {
        dataGame.resetData()
        boardControl.start()
        pieceControl.start()
    }

    const verifyCheckmate = ({ side, board }: { side: TypeSide, board: TypeBoard }) => {
        return pieceControl.verifyCheckMate({ side, board })
    }

    const findCheck = ({ side, board }: { side: TypeSide, board: TypeBoard }) => {
        return pieceControl.findCheck({ side, board })
    }

    const movePiece = ({ position, target, promotion }: { position: BoardCoordinates, target: BoardCoordinates, promotion?: TypePromotion | null }) => {
        if (!dataGame.data.isRunning) { return false }

        const { piece } = pieceControl.getPiece({ position, ...dataGame.data })

        if (!piece) { return false }

        if (piece.side != dataGame.data.sideTime) { return false }

        const isValidPiece = pieceControl.validMovePiece({ position, target, promotion })

        if (!isValidPiece.valueOf || !isValidPiece.typeMove) { return false }

        let { typeMove, actions }: { typeMove: TypeMove, actions: TypeActionArray } = isValidPiece

        actions.map(({ piece, position, type, target, typePromotion }) => {
            if (type == "promotion" && typePromotion) {
                piece.type = typePromotion
                pieceControl.updatePiecePosition({ piece, newPosition: position })
            }
            if (type == "move" && target) {
                pieceControl.updatePiecePosition({ piece, newPosition: target })
            }
            if (type == "death") {
                pieceControl.removePiece({ piece })
            }
        })

        toggleSideTime()

        if (findCheck({ board: boardControl.getBoardState(), side: dataGame.data.sideTime })) {
            if (verifyCheckmate({ board: boardControl.getBoardState(), side: dataGame.data.sideTime })) {
                gameOver({ winner: dataGame.data.sideTime == "white" ? "black" : "white" })
                typeMove = "checkmate"
                console.log("Checkmate!")
            } else {
                typeMove = "check"
            }
        }

        historyControl.createMove({ actions, typeMove })

        return true
    }

    const gameOver = ({ winner }: { winner: TypeWinner }) => {
        dataGame.gameOver({ winner })
    }

    const toggleSideTime = () => {
        const side = dataGame.data.sideTime == "black" ? "white" : "black"

        dataGame.updateSideTime({ side })
    }

    const validPromotion = ({ position, target }: { position: BoardCoordinates, target: BoardCoordinates }) => {
        return pieceControl.validPromotion({ position, target })
    }

    return {
        startGame,
        movePiece,
        validPromotion,
    }
}