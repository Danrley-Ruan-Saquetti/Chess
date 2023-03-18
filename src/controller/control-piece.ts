import { BoardCoordinates, IAction, IPiece, TypeAcceptableMoveKing, TypeAcceptableMovePawn, TypeAction, TypeActionArray, TypeBoard, TypeMove, TypePiece, TypePromotion, TypeSide } from "../model/model-game.js"
import dataGame from "../data/data-game.js"
import generatedId from "../util/generated-id.js"
import { RULE_PIECES, POSITION_INITIAL, SIZE_BOARD } from "../util/rules.js"
import BoardControl from "./control-board.js"
import HistoryControl from "./control-history.js"

export default function PieceControl() {
    const boardControl = BoardControl()
    const historyControl = HistoryControl()

    const createBoardPieces = () => {
        const side: TypeSide[] = ["white", "black"]

        side.forEach(side => {
            POSITION_INITIAL.forEach(pi => {
                pi.positions.forEach(pos => {
                    const piece = createPiece(pi.type, side)

                    addPiece({
                        piece, position: {
                            x: side == "black" ? pos.x : SIZE_BOARD.rows - 1 - pos.x,
                            y: pos.y
                        }
                    })
                })
            })
        })
    }

    const createBoardPiecesExperimental = () => {
        const experimentalPosition: { side: TypeSide, type: TypePiece, position: BoardCoordinates }[] = [
            { side: "white", type: "pawn", position: { x: 4, y: 3 } },
        ]

        experimentalPosition.forEach(pos => {
            const piece = createPiece(pos.type, pos.side)

            addPiece({ piece, ...pos })
        })
    }

    const start = () => {
        createBoardPieces()
        // createBoardPiecesExperimental()
    }

    const addPiece = ({ piece, position }: { piece: IPiece, position: BoardCoordinates }) => {
        dataGame.addPiece({ piece, position })
    }

    const removePiece = ({ piece }: { piece: IPiece }) => {
        dataGame.removePiece({ piece })
    }

    const createPiece = (type: TypePiece, side: TypeSide) => {
        const piece: IPiece = {
            id: generatedId(),
            isMoved: false,
            side,
            type
        }

        return piece
    }

    const getPiece = ({ id, position, board }: { id?: String, position?: BoardCoordinates, board: TypeBoard }) => {
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const piece = board[i][j]

                if (!piece) { continue }

                if (id && piece.id == id) { return { piece, position: { x: i, y: j } } }

                if (position && i == position.x && j == position.y) { return { piece, position: { x: i, y: j } } }
            }
        }

        return { piece: null, position: null }
    }

    const getKing = ({ side, board }: { side: TypeSide, board: TypeBoard }) => {
        const response: { piece: IPiece | null, position: BoardCoordinates | null } = (function () {
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j < board[i].length; j++) {
                    const piece = board[i][j]

                    if (!piece) { continue }

                    if (piece.side != side) { continue }

                    if (piece.type == "king") { return { piece, position: { x: i, y: j } } }
                }
            }

            return { piece: null, position: null }
        }())

        return response
    }

    const updatePiecePosition = ({ piece, newPosition, board }: { piece: IPiece, newPosition: BoardCoordinates, board?: TypeBoard }) => {
        if (!board) {
            dataGame.updatePiecePosition({ piece, newPosition })
            return
        }

        const { position } = getPiece({ ...piece, board })

        if (!position) { return }

        if (newPosition.x < 0 || newPosition.x > board.length - 1) { return }

        if (newPosition.y < 0 || newPosition.y > board[0].length - 1) { return }

        board[position.x][position.y] = null
        board[newPosition.x][newPosition.y] = piece
    }

    const findAcceptableMove = ({ piece, target, board, position: _position }: { position?: BoardCoordinates, piece: IPiece, target: BoardCoordinates, board: TypeBoard }) => {
        const { position } = _position ? { position: _position } : getPiece({ ...piece, board })

        if (!position) { return null }

        return RULE_PIECES.acceptableMoves[piece.type][piece.side].find(move => { return target.x - position.x == move.x && target.y - position.y == move.y }) || null
    }

    const findPieceBlockTarget = ({ piece, target, board }: { board: TypeBoard, piece: IPiece, target: BoardCoordinates }) => {
        const { position } = getPiece({ ...piece, board })

        if (!position) { return null }

        const direction = boardControl.getDirection({ position, target })

        const pieceBlocked: IPiece = boardControl.travelHouses({
            direction, position, target, observer: ({ position }: { position: BoardCoordinates }) => {
                const piece = board[position.x][position.y]

                if (!piece) { return { valueOf: false, data: null } }

                return { valueOf: true, data: piece }
            }
        })

        return pieceBlocked
    }

    const findCheckHorse = ({ position, side, board }: { side: TypeSide, position: BoardCoordinates, board: TypeBoard }) => {
        for (let i = 0; i < RULE_PIECES.acceptableMoves.horse[side].length; i++) {
            const move = RULE_PIECES.acceptableMoves.horse[side][i]

            const { piece } = getPiece({ position: { x: move.x + position.x, y: move.y + position.y }, board })

            if (!piece) { continue }

            if (piece.type != "horse") { continue }

            if (piece.side == side) { continue }

            return { valueOf: true, piece }
        }

        return { valueOf: false, piece: null }
    }

    const findCheckPawn = ({ position, side, board }: { side: TypeSide, position: BoardCoordinates, board: TypeBoard }) => {
        for (let i = 0; i < RULE_PIECES.acceptableMoves.pawn[side].length; i++) {
            const move: TypeAcceptableMovePawn = RULE_PIECES.acceptableMoves.pawn[side][i]

            if (!move.attack) { continue }

            const { piece } = getPiece({ position: { x: move.x + position.x, y: move.y + position.y }, board })

            if (!piece) { continue }

            if (piece.type != "pawn") { continue }

            if (piece.side == side) { continue }

            return true
        }

        return false
    }

    const findCheckSomeLine = ({ position, side, directions, board }: { side: TypeSide, position: BoardCoordinates, directions: BoardCoordinates[], board: TypeBoard }) => {
        let piece: IPiece | null = null

        for (let i = 0; i < directions.length; i++) {
            const pi = verifySomeLine({ position, direction: directions[i], board })

            if (!pi) { continue }

            if (pi.side == side) { continue }

            piece = pi
        }

        if (!piece) { return null }

        if (piece.side == side) { return null }

        return piece
    }

    const findCheck = ({ side, board }: { side: TypeSide, board: TypeBoard }) => {
        const { position } = getKing({ side, board })

        if (!position) { return false }

        const isChecked = findAttack({ side, position, board })

        return isChecked
    }

    const findAttack = ({ side, position, board }: { side: TypeSide, position: BoardCoordinates, board: TypeBoard }) => {
        if (findCheckHorse({ position, side, board }).valueOf) { return true }

        const pieceDiagonal = findCheckSomeLine({ position, side, directions: [{ x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }], board })

        if (pieceDiagonal && (pieceDiagonal.type == "bishop" || pieceDiagonal.type == "queen" || pieceDiagonal.type == "pawn")) {
            if (pieceDiagonal.type == "pawn") {
                const piecePawn = findCheckPawn({ position, side, board })

                return piecePawn
            }
            return true
        }

        const pieceStraight = findCheckSomeLine({ position, side, directions: [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }], board })

        if (pieceStraight && (pieceStraight.type == "rook" || pieceStraight.type == "queen")) { return true }

        return false
    }

    const verifyCheckMate = ({ side, board }: { side: TypeSide, board: TypeBoard }) => {
        const { piece: pieceKing, position: positionKing } = getKing({ side, board })

        if (!pieceKing || !positionKing) { return false }

        const attemptMove = ({ piece, position }: { piece: IPiece, position: BoardCoordinates }) => {
            const { position: pos } = getPiece({ ...piece, board })

            if (!pos) { return false }

            const validMove = validMovePiece({ position: pos, target: position, board: boardControl.getBoardState(), promotion: "queen" })

            if (!validMove.valueOf) { return false }

            return validMove.valueOf
        }

        for (let i = 0; i < RULE_PIECES.acceptableMoves.king[side].length; i++) {
            const move = RULE_PIECES.acceptableMoves.king[side][i]

            const position = { x: move.x + positionKing.x, y: move.y + positionKing.y }

            const { piece } = getPiece({ position, board })

            if (piece && piece.side == pieceKing.side) { continue }

            if (attemptMove({ position, piece: pieceKing })) { return false }
        }

        const getPieceMoveToHouse = ({ position }: { position: BoardCoordinates }) => {
            const directions = [
                { x: 0, y: 1 },
                { x: -1, y: -1 },
                { x: -1, y: 0 },
                { x: -1, y: -1 },
                { x: 0, y: -1 },
                { x: 1, y: -1 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
            ]

            for (let i = 0; i < directions.length; i++) {
                const pieceBlock = verifySomeLine({ position, board, direction: directions[i] })

                if (pieceBlock && pieceBlock.side == pieceKing.side && attemptMove({ piece: pieceBlock, position })) {
                    return pieceBlock
                }
            }

            return null
        }

        const blockAttack = ({ piece }: { piece: IPiece }) => {
            const { position } = getPiece({ board, ...piece })

            if (!position) { return false }

            const pieceBlockAttack: IPiece | null = boardControl.travelHouses({
                direction: boardControl.getDirection({ position: positionKing, target: position }),
                position: positionKing,
                target: position,
                observer: ({ position: pos }: { position: BoardCoordinates }) => {
                    const pieceBlockHouse = getPieceMoveToHouse({ position: pos })

                    if (pieceBlockHouse) { return { valueOf: true, data: pieceBlockHouse } }

                    return { valueOf: false, data: null }
                }
            })

            if (pieceBlockAttack) { return true }

            const pieceTake = getPieceMoveToHouse({ position })

            if (pieceTake) { return true }

            return false
        }

        const pieceHorse = findCheckHorse({ board, position: positionKing, side })

        if (pieceHorse.valueOf && pieceHorse.piece) {
            const { position } = getPiece({ ...pieceHorse.piece, board })

            if (!position) { return false }

            const pieceTake = getPieceMoveToHouse({ position })

            if (pieceTake) { return true }

            return true
        }

        const pieceDiagonal = findCheckSomeLine({ position: positionKing, side, directions: [{ x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }], board })

        if (pieceDiagonal && (pieceDiagonal.type == "bishop" || pieceDiagonal.type == "queen" || pieceDiagonal.type == "pawn")) {
            if (blockAttack({ piece: pieceDiagonal })) { return false }

            return true
        }

        const pieceStraight = findCheckSomeLine({ position: positionKing, side, directions: [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }], board })

        if (pieceStraight && (pieceStraight.type == "rook" || pieceStraight.type == "queen")) {
            if (blockAttack({ piece: pieceStraight })) { return false }

            return true
        }

        return false // true
    }

    const verifySameDiagonal = ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard }) => {
        const { position } = getPiece({ ...piece, board })

        if (!position) { return false }

        return Math.abs(position.x - target.x) == Math.abs(position.y - target.y);
    }

    const verifySameStraight = ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard }) => {
        const { position } = getPiece({ ...piece, board })

        if (!position) { return false }

        return position.x == target.x || position.y == target.y;
    }

    const verifySomeLine = ({ direction, position, board }: { board: TypeBoard, direction: BoardCoordinates, position: BoardCoordinates }) => {
        for (let i = 1; (position.x + direction.x * i >= 0 && position.x + direction.x * i <= board.length - 1) && (position.y + direction.y * i >= 0 && position.y + direction.y * i <= board[0].length - 1); i++) {
            const realX = position.x + direction.x * i
            const realY = position.y + direction.y * i

            const piece = board[realX][realY]

            if (!piece) { continue }

            return piece
        }
    }

    const verifyRealNail = ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard }) => {
        if (piece.type == "king") { return false }

        const { position } = getPiece({ ...piece, board })

        if (!position) { return false }

        const { piece: pieceKing, position: positionKing } = getKing({ ...piece, board })

        if (!pieceKing || !positionKing) { return false }


        const pieceBetweenKing = findPieceBlockTarget({ piece, target: positionKing, board })

        if (pieceBetweenKing) { return false }

        const isLine = {
            diagonal: verifySameDiagonal({ piece, target: positionKing, board }),
            straight: verifySameStraight({ piece, target: positionKing, board })
        }

        if (isLine.diagonal || isLine.straight) {
            const direction = boardControl.getDirection({ position, target })

            const pieceAttacking = verifySomeLine({ position, direction, board })

            if (!pieceAttacking || pieceAttacking.side == piece.side) { return false }

            if (pieceAttacking.type == "queen") { return true }

            if (isLine.diagonal && pieceAttacking.type == "bishop") { return true }

            if (isLine.straight && pieceAttacking.type == "rook") { return true }
        }

        return false
    }

    const verifySwapKing = ({ piece, target, board }: { board: TypeBoard, piece: IPiece, target: BoardCoordinates }) => {
        const { position } = getPiece({ ...piece, board })

        if (!position) { return { valueOf: false, rookPiece: null } }

        const isSwapShort = position.y - target.y < 0

        const posRook = { x: position.x, y: isSwapShort ? board[0].length - 1 : 0 }

        const { piece: rookPiece } = getPiece({ position: posRook, board })

        if (!rookPiece || rookPiece.type != "rook" || rookPiece.isMoved || rookPiece.side != piece.side) { return { valueOf: false, rookPiece: null } }

        if (findPieceBlockTarget({ piece, target: posRook, board })) { return { valueOf: false, rookPiece: null } }

        const isSwapAttacked = (function () {
            const direction = boardControl.getDirection({ position, target })

            for (let i = 1; target.x != position.x + i * direction.x || target.y != position.y + i * direction.y; i++) {
                const realX = position.x + i * direction.x
                const realY = position.y + i * direction.y

                const isHouseAttacked = findAttack({ ...piece, position: { x: realX, y: realY }, board })

                if (!isHouseAttacked) { continue }

                return true
            }

            return false
        }())

        if (isSwapAttacked) { return { valueOf: false, rookPiece: null } }

        return { valueOf: true, rookPiece }
    }

    const validPromotion = ({ position, target }: { position: BoardCoordinates, target: BoardCoordinates }) => {
        const { piece } = getPiece({ position, board: dataGame.data.board })

        if (!piece) { return false }

        if (!piece || piece.type != "pawn") { return false }

        if (piece.side == "white" && (position.x != 1 || target.x != 0)) { return false }

        if (piece.side == "black" && (position.x != dataGame.data.board.length - 2 || target.x != dataGame.data.board.length - 1)) { return false }

        return true
    }

    const validPassant = ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard }) => {
        const { position } = getPiece({ board, ...piece })

        if (!position) { return { valueOf: false, piece: null } }

        switch (piece.side) {
            case "white":
                if (position.x != 3) { return { valueOf: false, piece: null } }
                break
            case "black":
                if (position.x != board.length - 4) { return { valueOf: false, piece: null } }
        }

        const { move } = historyControl.getMove({})

        if (!move) { return { valueOf: false, piece: null } }

        const moveMain = move.actions.find(ac => { return ac.isMain })

        if (!moveMain) { return { valueOf: false, piece: null } }

        if (moveMain.piece.side == piece.side || moveMain.piece.type != "pawn") { return { valueOf: false, piece: null } }

        if (moveMain.type != "move" || !moveMain.target) { return { valueOf: false, piece: null } }

        if (moveMain.target.y != target.y) { return { valueOf: false, piece: null } }

        const moveAccepted: TypeAcceptableMovePawn = findAcceptableMove({ piece: moveMain.piece, position: moveMain.position, target: moveMain.target, board })

        if (!moveAccepted) { return { valueOf: false, piece: null } }

        if (!moveAccepted.firstMove) { return { valueOf: false, piece: null } }

        return { valueOf: true, piece: moveMain.piece }
    }

    const MAP_VERIFY_ACCEPT_MOVEMENTS = {
        king: ({ piece, target, board, actions }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray }) => {
            const move: TypeAcceptableMoveKing = findAcceptableMove({ piece, target, board })

            if (!move) { return { valueOf: false } }

            let typeMove: TypeMove = "move"

            if (move.swap) {
                if (piece.isMoved) { return { valueOf: false } }

                const { position } = getPiece({ ...piece, board })

                if (!position) { return { valueOf: false } }

                if (position.y != 4) { return { valueOf: false } }

                switch (piece.side) {
                    case "white":
                        if (position.x != board.length - 1) { return { valueOf: false } }
                        break
                    case "black":
                        if (position.x != 0) { return { valueOf: false } }
                }

                const acceptSwap = verifySwapKing({ piece, target, board })

                if (!acceptSwap.valueOf || !acceptSwap.rookPiece) { return { valueOf: false } }

                const { position: oldPosRook } = getPiece({ ...acceptSwap.rookPiece, board })

                if (!oldPosRook) { return { valueOf: false } }

                const positionRookSwap = {
                    x: position.x,
                    y: position.y - target.y < 0 ? board[0].length - 3 : 3
                }

                updatePiecePosition({ piece: acceptSwap.rookPiece, newPosition: positionRookSwap, board })

                actions.push({ piece: acceptSwap.rookPiece, position: oldPosRook, type: "move", target: positionRookSwap, isMain: false })

                typeMove = "swap"
            }

            return { valueOf: true, typeMove }
        },
        queen: ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray }) => {
            if (!verifySameStraight({ piece, target, board }) && !verifySameDiagonal({ piece, target, board })) { return { valueOf: false } }

            const pieceBlocked = findPieceBlockTarget({ piece, target, board })

            return { valueOf: pieceBlocked == null }
        },
        rook: ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray }) => {
            if (!verifySameStraight({ piece, target, board })) { return { valueOf: false } }

            const pieceBlocked = findPieceBlockTarget({ piece, target, board })

            return { valueOf: pieceBlocked == null }
        },
        bishop: ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray }) => {
            if (!verifySameDiagonal({ piece, target, board })) { return { valueOf: false } }

            const pieceBlocked = findPieceBlockTarget({ piece, target, board })

            return { valueOf: pieceBlocked == null }
        },
        pawn: ({ piece, target, board, actions, promotion }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray, promotion?: TypePromotion | null }) => {
            const move: TypeAcceptableMovePawn = findAcceptableMove({ piece, target, board })

            if (!move) { return { valueOf: false } }

            const { piece: pieceTarget } = getPiece({ position: target, board })

            const { position } = getPiece({ ...piece, board })

            if (!position) { return { valueOf: false } }

            let typeMove: TypeMove = "move"

            if (move.attack) {
                if (!pieceTarget) {
                    const { valueOf: passantValid, piece: pieceAttacked } = validPassant({ piece, target, board })

                    if (!passantValid || !pieceAttacked) { return { valueOf: false } }

                    const { position: posPieceAttacked } = getPiece({ board, ...pieceAttacked })

                    if (!posPieceAttacked) { return { valueOf: false } }

                    actions.push({ piece: pieceAttacked, position: posPieceAttacked, type: "death", isMain: false })

                    typeMove = "passant"

                    return { valueOf: true, typeMove }
                }

                if (pieceTarget.side == piece.side) { return { valueOf: false } }
            } else {
                if (pieceTarget) { return { valueOf: false } }
            }
            if (move.firstMove) {
                const { position } = getPiece({ ...piece, board })

                if (!position) { return { valueOf: false } }

                switch (piece.side) {
                    case "white": {
                        if (position.x != board.length - 2) { return { valueOf: false } }
                        break
                    }
                    case "black":
                        if (position.x != 1) { return { valueOf: false } }
                }

                const pieceBlocked = findPieceBlockTarget({ piece, target, board })

                if (pieceBlocked) { return { valueOf: false } }
            }

            if ((piece.side == "white" && position.x == 1) || (piece.side == "black" && position.x == board.length - 2)) {
                if (!promotion) {
                    return { valueOf: false }
                }

                if (promotion != "bishop" && promotion != "horse" && promotion != "queen" && promotion != "rook") { return { valueOf: false } }

                actions.push({ piece, position, type: "promotion", target, typePromotion: promotion, isMain: false })

                typeMove = "promotion"
            }

            return { valueOf: true, typeMove }
        },
        horse: ({ piece, target, board }: { piece: IPiece, target: BoardCoordinates, board: TypeBoard, actions: TypeActionArray }) => {
            const move = findAcceptableMove({ piece, target, board })

            if (!move) { return { valueOf: false } }

            return { valueOf: true }
        }
    }

    const validMovePiece = ({ position, target, promotion, board = boardControl.getBoardState() }: { position: BoardCoordinates, target: BoardCoordinates, promotion?: TypePromotion | null, board?: TypeBoard }) => {
        const { piece } = getPiece({ position, ...dataGame.data })

        if (!piece) { return { valueOf: false, actions: [], typeMove: null } }

        const { piece: targetPiece, position: targetPosition } = getPiece({ position: target, ...dataGame.data })

        if (targetPiece) {
            if (targetPiece.side == piece.side) { return { valueOf: false, actions: [], typeMove: null } }
        }

        const actions: TypeActionArray = []

        const acceptMove = MAP_VERIFY_ACCEPT_MOVEMENTS[piece.type] ? MAP_VERIFY_ACCEPT_MOVEMENTS[piece.type]({ piece, target, board, actions, promotion }) : { valueOf: false }

        if (!acceptMove.valueOf) { return { valueOf: false, actions: [], typeMove: null } }

        // @ts-expect-error
        let typeMove: TypeMove = acceptMove.typeMove || "move"

        updatePiecePosition({ piece, newPosition: target, board })

        if (findCheck({ ...piece, board })) { return { valueOf: false, actions: [], typeMove: null } }

        if (targetPiece) {
            actions.push({ piece: targetPiece, position: targetPosition, type: "death", isMain: false })

            typeMove = "take"
        }

        actions.push({ piece, position, type: "move", target, isMain: true })

        return { valueOf: true, actions, typeMove }
    }

    return {
        start,
        findAcceptableMove,
        findPieceBlockTarget,
        findCheckHorse,
        findCheckPawn,
        findCheckSomeLine,
        getPiece,
        getKing,
        findCheck,
        verifySameDiagonal,
        verifySameStraight,
        verifySomeLine,
        verifyRealNail,
        verifySwapKing,
        validPromotion,
        validMovePiece,
        verifyCheckMate,
        updatePiecePosition,
        removePiece,
    }
}