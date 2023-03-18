import dataGame from "../data/data-game.js";
import generatedId from "../util/generated-id.js";
import { RULE_PIECES, POSITION_INITIAL, SIZE_BOARD, ALL_DIRECTIONS } from "../util/rules.js";
import BoardControl from "./control-board.js";
import HistoryControl from "./control-history.js";
export default function PieceControl() {
    const boardControl = BoardControl();
    const historyControl = HistoryControl();
    const createBoardPieces = () => {
        const side = ["white", "black"];
        side.forEach(side => {
            POSITION_INITIAL.forEach(pi => {
                pi.positions.forEach(pos => {
                    const piece = createPiece(pi.type, side);
                    addPiece({
                        piece, position: {
                            x: side == "black" ? pos.x : SIZE_BOARD.rows - 1 - pos.x,
                            y: pos.y
                        }
                    });
                });
            });
        });
    };
    const createBoardPiecesExperimental = () => {
        const experimentalPosition = [
            { side: "white", type: "pawn", position: { x: 4, y: 3 } },
        ];
        experimentalPosition.forEach(pos => {
            const piece = createPiece(pos.type, pos.side);
            addPiece({ piece, ...pos });
        });
    };
    const verifyIsDiagonal = ({ position, target }) => {
        return position.x != target.x && position.y != position.y;
    };
    const start = () => {
        createBoardPieces();
    };
    const addPiece = ({ piece, position }) => {
        dataGame.addPiece({ piece, position });
    };
    const removePiece = ({ piece }) => {
        dataGame.removePiece({ piece });
    };
    const createPiece = (type, side) => {
        const piece = {
            id: generatedId(),
            isMoved: false,
            side,
            type
        };
        return piece;
    };
    const getPiece = ({ id, position, board }) => {
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const piece = board[i][j];
                if (!piece) {
                    continue;
                }
                if (id && piece.id == id) {
                    return { piece, position: { x: i, y: j } };
                }
                if (position && i == position.x && j == position.y) {
                    return { piece, position: { x: i, y: j } };
                }
            }
        }
        return { piece: null, position: null };
    };
    const getKing = ({ side, board }) => {
        const response = (function () {
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j < board[i].length; j++) {
                    const piece = board[i][j];
                    if (!piece) {
                        continue;
                    }
                    if (piece.side != side) {
                        continue;
                    }
                    if (piece.type == "king") {
                        return { piece, position: { x: i, y: j } };
                    }
                }
            }
            return { piece: null, position: null };
        }());
        return response;
    };
    const updatePiecePosition = ({ piece, newPosition, board }) => {
        if (!board) {
            dataGame.updatePiecePosition({ piece, newPosition });
            return;
        }
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return;
        }
        if (newPosition.x < 0 || newPosition.x > board.length - 1) {
            return;
        }
        if (newPosition.y < 0 || newPosition.y > board[0].length - 1) {
            return;
        }
        board[position.x][position.y] = null;
        board[newPosition.x][newPosition.y] = piece;
    };
    const findAcceptableMove = ({ piece, target, board, position: _position }) => {
        const { position } = _position ? { position: _position } : getPiece({ ...piece, board });
        if (!position) {
            return null;
        }
        return RULE_PIECES.acceptableMoves[piece.type][piece.side].find(move => { return target.x - position.x == move.x && target.y - position.y == move.y; }) || null;
    };
    const findPieceBlockTarget = ({ piece, target, board }) => {
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return null;
        }
        const direction = boardControl.getDirection({ position, target });
        const pieceBlocked = boardControl.travelHouses({
            direction, position, target, observer: ({ position }) => {
                const piece = board[position.x][position.y];
                if (!piece) {
                    return { valueOf: false, data: null };
                }
                return { valueOf: true, data: piece };
            }
        });
        return pieceBlocked;
    };
    const findCheckHorse = ({ position, side, board }) => {
        for (let i = 0; i < RULE_PIECES.acceptableMoves.horse[side].length; i++) {
            const move = RULE_PIECES.acceptableMoves.horse[side][i];
            const { piece } = getPiece({ position: { x: move.x + position.x, y: move.y + position.y }, board });
            if (!piece) {
                continue;
            }
            if (piece.type != "horse") {
                continue;
            }
            if (piece.side == side) {
                continue;
            }
            return { valueOf: true, piece };
        }
        return { valueOf: false, piece: null };
    };
    const findCheckPawn = ({ position, side, board }) => {
        for (let i = 0; i < RULE_PIECES.acceptableMoves.pawn[side].length; i++) {
            const move = RULE_PIECES.acceptableMoves.pawn[side][i];
            if (!move.attack) {
                continue;
            }
            const { piece } = getPiece({ position: { x: move.x + position.x, y: move.y + position.y }, board });
            if (!piece) {
                continue;
            }
            if (piece.type != "pawn") {
                continue;
            }
            if (piece.side == side) {
                continue;
            }
            return true;
        }
        return false;
    };
    const findCheckSomeLine = ({ position, side, directions, board }) => {
        let piece = null;
        for (let i = 0; i < directions.length; i++) {
            const pi = verifySomeLine({ position, direction: directions[i], board });
            if (!pi) {
                continue;
            }
            if (pi.side == side) {
                continue;
            }
            if (verifyIsDiagonal({ position, target: directions[i] })) {
                if (pi.type != "bishop" && pi.type != "queen" && pi.type != "pawn") {
                    continue;
                }
                if (pi.type == "pawn" && !findCheckPawn({ position, side, board })) {
                    continue;
                }
            }
            else {
                if (pi.type != "rook" && pi.type != "queen") {
                    continue;
                }
            }
            piece = pi;
        }
        if (!piece) {
            return null;
        }
        if (piece.side == side) {
            return null;
        }
        return piece;
    };
    const findCheck = ({ side, board }) => {
        const { position } = getKing({ side, board });
        if (!position) {
            return false;
        }
        const isChecked = findAttack({ side, position, board });
        return isChecked;
    };
    const findAttack = ({ side, position, board }) => {
        if (findCheckHorse({ position, side, board }).valueOf) {
            return true;
        }
        const pieceAttack = findCheckSomeLine({ position, side, directions: ALL_DIRECTIONS, board });
        if (pieceAttack) {
            return true;
        }
        return false;
    };
    const verifyCheckMate = ({ side, board }) => {
        const { piece: pieceKing, position: positionKing } = getKing({ side, board });
        if (!pieceKing || !positionKing) {
            return false;
        }
        const attemptMove = ({ piece, position }) => {
            const { position: pos } = getPiece({ ...piece, board });
            if (!pos) {
                return false;
            }
            const validMove = validMovePiece({ position: pos, target: position, board: boardControl.getBoardState(board), promotion: "queen" });
            if (!validMove.valueOf) {
                return false;
            }
            return validMove.valueOf;
        };
        for (let i = 0; i < RULE_PIECES.acceptableMoves.king[side].length; i++) {
            const move = RULE_PIECES.acceptableMoves.king[side][i];
            const position = { x: move.x + positionKing.x, y: move.y + positionKing.y };
            const { piece } = getPiece({ position, board });
            if (piece && piece.side == pieceKing.side) {
                continue;
            }
            if (attemptMove({ position, piece: pieceKing })) {
                return false;
            }
        }
        const getPieceMoveToHouse = ({ position }) => {
            for (let i = 0; i < ALL_DIRECTIONS.length; i++) {
                const pieceBlock = verifySomeLine({ position, board, direction: ALL_DIRECTIONS[i] });
                if (pieceBlock && pieceBlock.side == pieceKing.side && attemptMove({ piece: pieceBlock, position })) {
                    return pieceBlock;
                }
            }
            return null;
        };
        const blockAttack = ({ piece }) => {
            const { position } = getPiece({ board, ...piece });
            if (!position) {
                return false;
            }
            const pieceBlockAttack = boardControl.travelHouses({
                direction: boardControl.getDirection({ position: positionKing, target: position }),
                position: positionKing,
                target: position,
                observer: ({ position: pos }) => {
                    const pieceBlockHouse = getPieceMoveToHouse({ position: pos });
                    if (pieceBlockHouse) {
                        return { valueOf: true, data: pieceBlockHouse };
                    }
                    return { valueOf: false, data: null };
                }
            });
            if (pieceBlockAttack) {
                return true;
            }
            const pieceTake = getPieceMoveToHouse({ position });
            if (pieceTake) {
                return true;
            }
            return false;
        };
        const pieceHorse = findCheckHorse({ board, position: positionKing, side });
        if (pieceHorse.valueOf && pieceHorse.piece) {
            const { position } = getPiece({ ...pieceHorse.piece, board });
            if (!position) {
                return false;
            }
            const pieceTake = getPieceMoveToHouse({ position });
            if (pieceTake) {
                return true;
            }
            return true;
        }
        const pieceAttack = findCheckSomeLine({ position: positionKing, side, directions: ALL_DIRECTIONS, board });
        if (pieceAttack && !blockAttack({ piece: pieceAttack })) {
            return true;
        }
        return false;
    };
    const verifySameDiagonal = ({ piece, target, board }) => {
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return false;
        }
        return Math.abs(position.x - target.x) == Math.abs(position.y - target.y);
    };
    const verifySameStraight = ({ piece, target, board }) => {
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return false;
        }
        return position.x == target.x || position.y == target.y;
    };
    const verifySomeLine = ({ direction, position, board }) => {
        for (let i = 1; (position.x + direction.x * i >= 0 && position.x + direction.x * i <= board.length - 1) && (position.y + direction.y * i >= 0 && position.y + direction.y * i <= board[0].length - 1); i++) {
            const realX = position.x + direction.x * i;
            const realY = position.y + direction.y * i;
            const piece = board[realX][realY];
            if (!piece) {
                continue;
            }
            return piece;
        }
    };
    const verifyRealNail = ({ piece, target, board }) => {
        if (piece.type == "king") {
            return false;
        }
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return false;
        }
        const { piece: pieceKing, position: positionKing } = getKing({ ...piece, board });
        if (!pieceKing || !positionKing) {
            return false;
        }
        const pieceBetweenKing = findPieceBlockTarget({ piece, target: positionKing, board });
        if (pieceBetweenKing) {
            return false;
        }
        const isLine = {
            diagonal: verifySameDiagonal({ piece, target: positionKing, board }),
            straight: verifySameStraight({ piece, target: positionKing, board })
        };
        if (isLine.diagonal || isLine.straight) {
            const direction = boardControl.getDirection({ position, target });
            const pieceAttacking = verifySomeLine({ position, direction, board });
            if (!pieceAttacking || pieceAttacking.side == piece.side) {
                return false;
            }
            if (pieceAttacking.type == "queen") {
                return true;
            }
            if (isLine.diagonal && pieceAttacking.type == "bishop") {
                return true;
            }
            if (isLine.straight && pieceAttacking.type == "rook") {
                return true;
            }
        }
        return false;
    };
    const verifySwapKing = ({ piece, target, board }) => {
        const { position } = getPiece({ ...piece, board });
        if (!position) {
            return { valueOf: false, rookPiece: null };
        }
        const isSwapShort = position.y - target.y < 0;
        const posRook = { x: position.x, y: isSwapShort ? board[0].length - 1 : 0 };
        const { piece: rookPiece } = getPiece({ position: posRook, board });
        if (!rookPiece || rookPiece.type != "rook" || rookPiece.isMoved || rookPiece.side != piece.side) {
            return { valueOf: false, rookPiece: null };
        }
        if (findPieceBlockTarget({ piece, target: posRook, board })) {
            return { valueOf: false, rookPiece: null };
        }
        const isSwapAttacked = (function () {
            const direction = boardControl.getDirection({ position, target });
            for (let i = 1; target.x != position.x + i * direction.x || target.y != position.y + i * direction.y; i++) {
                const realX = position.x + i * direction.x;
                const realY = position.y + i * direction.y;
                const isHouseAttacked = findAttack({ ...piece, position: { x: realX, y: realY }, board });
                if (!isHouseAttacked) {
                    continue;
                }
                return true;
            }
            return false;
        }());
        if (isSwapAttacked) {
            return { valueOf: false, rookPiece: null };
        }
        return { valueOf: true, rookPiece };
    };
    const validPromotion = ({ position, target }) => {
        const { piece } = getPiece({ position, board: dataGame.data.board });
        if (!piece) {
            return false;
        }
        if (!piece || piece.type != "pawn") {
            return false;
        }
        if (piece.side == "white" && (position.x != 1 || target.x != 0)) {
            return false;
        }
        if (piece.side == "black" && (position.x != dataGame.data.board.length - 2 || target.x != dataGame.data.board.length - 1)) {
            return false;
        }
        return true;
    };
    const validPassant = ({ piece, target, board }) => {
        const { position } = getPiece({ board, ...piece });
        if (!position) {
            return { valueOf: false, piece: null };
        }
        switch (piece.side) {
            case "white":
                if (position.x != 3) {
                    return { valueOf: false, piece: null };
                }
                break;
            case "black":
                if (position.x != board.length - 4) {
                    return { valueOf: false, piece: null };
                }
        }
        const { move } = historyControl.getMove({});
        if (!move) {
            return { valueOf: false, piece: null };
        }
        const moveMain = move.actions.find(ac => { return ac.isMain; });
        if (!moveMain) {
            return { valueOf: false, piece: null };
        }
        if (moveMain.piece.side == piece.side || moveMain.piece.type != "pawn") {
            return { valueOf: false, piece: null };
        }
        if (moveMain.type != "move" || !moveMain.target) {
            return { valueOf: false, piece: null };
        }
        if (moveMain.target.y != target.y) {
            return { valueOf: false, piece: null };
        }
        const moveAccepted = findAcceptableMove({ piece: moveMain.piece, position: moveMain.position, target: moveMain.target, board });
        if (!moveAccepted) {
            return { valueOf: false, piece: null };
        }
        if (!moveAccepted.firstMove) {
            return { valueOf: false, piece: null };
        }
        return { valueOf: true, piece: moveMain.piece };
    };
    const MAP_VERIFY_ACCEPT_MOVEMENTS = {
        king: ({ piece, target, board, actions }) => {
            const move = findAcceptableMove({ piece, target, board });
            if (!move) {
                return { valueOf: false };
            }
            let typeMove = "move";
            if (move.swap) {
                if (piece.isMoved) {
                    return { valueOf: false };
                }
                const { position } = getPiece({ ...piece, board });
                if (!position) {
                    return { valueOf: false };
                }
                if (position.y != 4) {
                    return { valueOf: false };
                }
                switch (piece.side) {
                    case "white":
                        if (position.x != board.length - 1) {
                            return { valueOf: false };
                        }
                        break;
                    case "black":
                        if (position.x != 0) {
                            return { valueOf: false };
                        }
                }
                const acceptSwap = verifySwapKing({ piece, target, board });
                if (!acceptSwap.valueOf || !acceptSwap.rookPiece) {
                    return { valueOf: false };
                }
                const { position: oldPosRook } = getPiece({ ...acceptSwap.rookPiece, board });
                if (!oldPosRook) {
                    return { valueOf: false };
                }
                const positionRookSwap = {
                    x: position.x,
                    y: position.y - target.y < 0 ? board[0].length - 3 : 3
                };
                updatePiecePosition({ piece: acceptSwap.rookPiece, newPosition: positionRookSwap, board });
                actions.push({ piece: acceptSwap.rookPiece, position: oldPosRook, type: "move", target: positionRookSwap, isMain: false });
                typeMove = "swap";
            }
            return { valueOf: true, typeMove };
        },
        queen: ({ piece, target, board }) => {
            if (!verifySameStraight({ piece, target, board }) && !verifySameDiagonal({ piece, target, board })) {
                return { valueOf: false };
            }
            const pieceBlocked = findPieceBlockTarget({ piece, target, board });
            return { valueOf: pieceBlocked == null };
        },
        rook: ({ piece, target, board }) => {
            if (!verifySameStraight({ piece, target, board })) {
                return { valueOf: false };
            }
            const pieceBlocked = findPieceBlockTarget({ piece, target, board });
            return { valueOf: pieceBlocked == null };
        },
        bishop: ({ piece, target, board }) => {
            if (!verifySameDiagonal({ piece, target, board })) {
                return { valueOf: false };
            }
            const pieceBlocked = findPieceBlockTarget({ piece, target, board });
            return { valueOf: pieceBlocked == null };
        },
        pawn: ({ piece, target, board, actions, promotion }) => {
            const move = findAcceptableMove({ piece, target, board });
            if (!move) {
                return { valueOf: false };
            }
            const { piece: pieceTarget } = getPiece({ position: target, board });
            const { position } = getPiece({ ...piece, board });
            if (!position) {
                return { valueOf: false };
            }
            let typeMove = "move";
            if (move.attack) {
                if (!pieceTarget) {
                    const { valueOf: passantValid, piece: pieceAttacked } = validPassant({ piece, target, board });
                    if (!passantValid || !pieceAttacked) {
                        return { valueOf: false };
                    }
                    const { position: posPieceAttacked } = getPiece({ board, ...pieceAttacked });
                    if (!posPieceAttacked) {
                        return { valueOf: false };
                    }
                    actions.push({ piece: pieceAttacked, position: posPieceAttacked, type: "death", isMain: false });
                    typeMove = "passant";
                    return { valueOf: true, typeMove };
                }
                if (pieceTarget.side == piece.side) {
                    return { valueOf: false };
                }
            }
            else {
                if (pieceTarget) {
                    return { valueOf: false };
                }
            }
            if (move.firstMove) {
                const { position } = getPiece({ ...piece, board });
                if (!position) {
                    return { valueOf: false };
                }
                switch (piece.side) {
                    case "white": {
                        if (position.x != board.length - 2) {
                            return { valueOf: false };
                        }
                        break;
                    }
                    case "black":
                        if (position.x != 1) {
                            return { valueOf: false };
                        }
                }
                const pieceBlocked = findPieceBlockTarget({ piece, target, board });
                if (pieceBlocked) {
                    return { valueOf: false };
                }
            }
            if ((piece.side == "white" && position.x == 1) || (piece.side == "black" && position.x == board.length - 2)) {
                if (!promotion) {
                    return { valueOf: false };
                }
                if (promotion != "bishop" && promotion != "horse" && promotion != "queen" && promotion != "rook") {
                    return { valueOf: false };
                }
                actions.push({ piece, position, type: "promotion", target, typePromotion: promotion, isMain: false });
                typeMove = "promotion";
            }
            return { valueOf: true, typeMove };
        },
        horse: ({ piece, target, board }) => {
            const move = findAcceptableMove({ piece, target, board });
            if (!move) {
                return { valueOf: false };
            }
            return { valueOf: true };
        }
    };
    const validMovePiece = ({ position, target, promotion, board = boardControl.getBoardState() }) => {
        const { piece } = getPiece({ position, ...dataGame.data });
        if (!piece) {
            return { valueOf: false, actions: [], typeMove: null };
        }
        const { piece: targetPiece, position: targetPosition } = getPiece({ position: target, ...dataGame.data });
        if (targetPiece) {
            if (targetPiece.side == piece.side) {
                return { valueOf: false, actions: [], typeMove: null };
            }
        }
        const actions = [];
        const acceptMove = MAP_VERIFY_ACCEPT_MOVEMENTS[piece.type] ? MAP_VERIFY_ACCEPT_MOVEMENTS[piece.type]({ piece, target, board, actions, promotion }) : { valueOf: false };
        if (!acceptMove.valueOf) {
            return { valueOf: false, actions: [], typeMove: null };
        }
        let typeMove = acceptMove.typeMove || "move";
        updatePiecePosition({ piece, newPosition: target, board });
        if (findCheck({ ...piece, board })) {
            return { valueOf: false, actions: [], typeMove: null };
        }
        if (targetPiece) {
            actions.push({ piece: targetPiece, position: targetPosition, type: "death", isMain: false });
            typeMove = "take";
        }
        actions.push({ piece, position, type: "move", target, isMain: true });
        return { valueOf: true, actions, typeMove };
    };
    return {
        start,
        getPiece,
        getKing,
        findCheck,
        validPromotion,
        validMovePiece,
        verifyCheckMate,
        updatePiecePosition,
        removePiece,
    };
}
