import dataGame from "../data/data-game.js"
import { BoardCoordinates, IPiece, TypeBoard } from "../model/model-game"
import { SIZE_BOARD } from "../util/rules.js"

export default function BoardControl() {

    const start = () => {
        const board = Array.from({ length: SIZE_BOARD.rows }, () => Array(SIZE_BOARD.columns).fill(null))

        dataGame.createBoard({ board })
    }

    const getBoardState = (boardEx?: TypeBoard) => {
        const boardState: TypeBoard = []

        const board = boardEx || dataGame.data.board

        for (let i = 0; i < board.length; i++) {
            const row: (IPiece | null)[] = []

            for (let j = 0; j < board[i].length; j++) {
                const piece = board[i][j]

                row.push(piece ? { ...piece } : null)
            }

            boardState.push(row)
        }

        return boardState
    }

    const getDirection = ({ position, target }: { position: BoardCoordinates, target: BoardCoordinates }) => {
        const direction = { x: 0, y: 0 }

        if (position.x > target.x) { direction.x = -1 }
        else if (position.x < target.x) { direction.x = 1 }

        if (position.y > target.y) { direction.y = -1 }
        else if (position.y < target.y) { direction.y = 1 }

        return direction
    }

    const travelHouses = ({ position, target, direction, observer = () => { } }: { direction: BoardCoordinates, position: BoardCoordinates, target: BoardCoordinates, observer?: Function }) => {

        for (let i = 1; target.x != position.x + i * direction.x || target.y != position.y + i * direction.y; i++) {
            const realX = position.x + i * direction.x
            const realY = position.y + i * direction.y

            const responseObserver: { valueOf: Boolean, data: any } = observer({ position: { x: realX, y: realY } })

            if (responseObserver.valueOf) { return responseObserver.data }
        }

        return null
    }

    return {
        getBoardState,
        getDirection,
        travelHouses,
        start,
    }
}