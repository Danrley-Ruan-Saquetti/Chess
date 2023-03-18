import { IGame, TypeSide, IPiece, BoardCoordinates, ILance, TypeBoard, TypeWinner, IMove, IAction } from "../model/model-game";
import generatedId from "../util/generated-id.js";

function DataGame() {
    const data: IGame = {
        id: "",
        board: [],
        sideTime: "white",
        historical: [],
        isRunning: true,
        winner: null
    }

    // Game
    const resetData = () => {
        data.id = generatedId()
        data.historical = []
        data.sideTime = "white"
        data.board = []
        data.isRunning = true
        data.winner = null
    }

    const updateSideTime = ({ side }: { side: TypeSide }) => {
        data.sideTime = side
    }

    const gameOver = ({ winner }: { winner: TypeWinner }) => {
        data.isRunning = false
        data.winner = winner
    }

    // Board
    const createBoard = ({ board }: { board: TypeBoard }) => {
        data.board = board
    }

    // Piece
    const addPiece = ({ piece, position }: { piece: IPiece, position: BoardCoordinates }) => {
        data.board[position.x][position.y] = piece
    }

    const getPiece = ({ id, position }: { id?: String, position?: BoardCoordinates }) => {
        const response: { piece: IPiece | null, position: BoardCoordinates | null } = (function () {
            for (let i = 0; i < data.board.length; i++) {
                for (let j = 0; j < data.board[i].length; j++) {
                    const piece = data.board[i][j]

                    if (!piece) { continue }

                    if (id) {
                        if (piece.id == id) { return { piece, position: { x: i, y: j } } }

                        continue
                    }

                    if (position) {
                        if (i == position.x && j == position.y) { return { piece, position: { x: i, y: j } } }
                    }
                }
            }

            return { piece: null, position: null }
        }())

        return response
    }

    const getKing = ({ side }: { side: TypeSide }) => {
        const response: { piece: IPiece | null, position: BoardCoordinates | null } = (function () {
            for (let i = 0; i < data.board.length; i++) {
                for (let j = 0; j < data.board[i].length; j++) {
                    const piece = data.board[i][j]

                    if (!piece) { continue }

                    if (piece.side != side) { continue }

                    if (piece.type == "king") { return { piece, position: { x: i, y: j } } }
                }
            }

            return { piece: null, position: null }
        }())

        return response
    }

    const updatePiecePosition = ({ piece, newPosition }: { piece: IPiece, newPosition: BoardCoordinates }) => {
        const { position } = getPiece(piece)

        if (!position) { return }

        piece.isMoved = true

        data.board[position.x][position.y] = null
        data.board[newPosition.x][newPosition.y] = piece
    }

    const removePiece = ({ piece }: { piece: IPiece }) => {
        const { position } = getPiece(piece)

        if (!position) { return }

        data.board[position.x][position.y] = null
    }

    // History - Lance
    const addLance = ({ lance }: { lance: ILance }) => {
        data.historical.push(lance)
    }

    const getLance = ({ id }: { id?: String }) => {
        if (id) {
            for (let i = 0; i < data.historical.length; i++) {
                const lance = data.historical[i]

                if (lance.id != id) { continue }

                return { lance, index: i }
            }

            return { lance: null, index: null }
        }

        const index = data.historical.length - 1

        return { lance: data.historical[index], index }
    }

    const removeLance = ({ id }: { id?: String }) => {
        const { index } = id ? getLance({ id }) : { index: data.historical.length - 1 }

        if (index == null) { return false }

        data.historical.splice(index, data.historical.length)

        return true
    }

    // History - Move
    const addMove = ({ move, idLance }: { move: IMove, idLance?: String }) => {
        const { index } = idLance ? getLance({ id: idLance }) : { index: data.historical.length - 1 }

        if (index == null) { return false }

        data.historical[index].moves.push(move)

        return true
    }

    const getMove = ({ id, idLance }: { id?: String, idLance?: String }) => {
        const { index } = idLance ? getLance({ id: idLance }) : { index: data.historical.length - 1 }

        if (index == null) { return { move: null, index: null } }

        if (id) {
            for (let j = 0; j < data.historical[index].moves.length; j++) {
                const move = data.historical[index].moves[j]

                if (move.id != id) { continue }

                return { move, index: j }
            }
        }

        return { move: data.historical[index].moves[data.historical[index].moves.length - 1], index: data.historical[index].moves.length - 1 }
    }

    const removeMove = ({ id, idLance }: { id?: String, idLance?: String }) => {
        const { index } = idLance ? getLance({ id: idLance }) : { index: data.historical.length - 1 }

        if (index == null) { return false }

        const { index: j } = getMove({ id, idLance })

        if (j == null) { return false }

        data.historical[index].moves.splice(j, data.historical[index].moves.length)

        data.historical[index + 1] && removeLance(data.historical[index + 1])

        return true
    }

    return {
        data,
        resetData,
        gameOver,
        createBoard,
        updateSideTime,
        updatePiecePosition,
        addPiece,
        removePiece,
        getPiece,
        getKing,
        addLance,
        getLance,
        removeLance,
        addMove,
        getMove,
        removeMove,
    }
}

const dataGame = DataGame()

export default dataGame