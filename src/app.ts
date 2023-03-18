import GameControl from "./controller/control-game.js";
import dataGame from "./data/data-game.js";
import { BoardCoordinates, IPiece, TypePromotion } from "./model/model-game.js";
import ControlRender from "./render.js";

const App = () => {
    const renderControl = ControlRender()
    const gameControl = GameControl()

    let pieceSelected: IPiece | null = null
    let target: BoardCoordinates | null = null
    let isClicked = false
    let isSelectPromotion = false
    let promotionSelected: TypePromotion | null = null

    const getData = () => {
        const { board, historical } = dataGame.data

        console.log("")

        for (let i = 0; i < historical.length; i++) {
            const lance = historical[i]

            let lanceLine = ""

            for (let j = 0; j < lance.moves.length; j++) {
                const move = lance.moves[j]

                let moveLine = ""

                const action = move.actions.find(act => { return act.isMain })

                if (!action) { continue }

                moveLine += ` | ${(action.piece.type.charAt(0) + action.piece.side.charAt(0)).toUpperCase()} ${move.type}`

                lanceLine += moveLine
            }

            console.log(lanceLine)
        }

        console.log("         0           1          2          3          4          5          6          7")
        console.log("    |----------|----------|----------|----------|----------|----------|----------|----------|")
        for (let i = 0; i < board.length; i++) {
            let line = i + "   |"
            for (let j = 0; j < board[i].length; j++) {
                const piece = board[i][j]

                if (!piece) {
                    line += "          |"
                    continue
                }

                line += `    ${(piece.type.charAt(0) + piece.side.charAt(0)).toUpperCase()}    |`
            }
            console.log(line)
            console.log("    |----------|----------|----------|----------|----------|----------|----------|----------|")
        }
    }

    const initComponents = () => {
        gameControl.startGame()
        renderControl.initComponents()

        // @ts-expect-error
        const houses: HTMLElement[] = document.querySelectorAll(".house")

        houses.forEach(house => {
            // @ts-expect-error
            house.addEventListener("click", clickHouse)
        })

        // @ts-expect-error
        const pieces: HTMLElement[] = document.querySelectorAll(".piece")

        pieces.forEach(piece => {
            // @ts-expect-error
            piece.addEventListener("click", clickPiece)
        })
    }

    const clickPiece = ({ target }: { target: HTMLElement }) => {
        if (!target) { return }

        const id = target.getAttribute("id") || undefined

        if (!id) { return }

        selectPiece({ id })
    }

    const clickHouse = ({ target: tEl }: { target: HTMLElement }) => {
        if (isSelectPromotion) {
            return cancelMove()
        }
        if (isClicked) {
            isClicked = false
            return
        }
        if (!pieceSelected) { return }

        const targetClick = {
            x: Number(tEl.getAttribute("position-x")),
            y: Number(tEl.getAttribute("position-y")),
        }

        target = targetClick

        validMovePiece()
    }

    const selectPiece = ({ id }: { id: String }) => {
        const { piece, position } = dataGame.getPiece({ id })

        if (!piece || !position || (piece.side != dataGame.data.sideTime)) { return }

        pieceSelected = piece

        isClicked = true

        renderControl.selectHouse({ position })
    }

    const activeSelectPromotion = () => {
        // @ts-expect-error
        const houses: HTMLElement[] = document.querySelectorAll(".type-promotions .house")

        houses.forEach(house => {
            // @ts-expect-error
            house.addEventListener("click", selectPromotion)
        })
    }

    const selectPromotion = ({ target: tEl }: { target: HTMLElement }) => {
        const typePromotion = tEl.getAttribute("type-promotion")

        if (!typePromotion || (typePromotion != "queen" && typePromotion != "rook" && typePromotion != "bishop" && typePromotion != "horse")) {
            return cancelMove()
        }

        promotionSelected = typePromotion

        movePiece()
    }

    const validMovePiece = () => {
        if (!pieceSelected || !target) { return }

        const { position, piece } = dataGame.getPiece(pieceSelected)

        if (!position || (position.x == target.x && position.y == target.y)) { return }

        isSelectPromotion = gameControl.validPromotion({ position, target })

        if (!piece) { return }

        if (isSelectPromotion) {
            renderControl.togglePromotions({ value: true, side: piece.side })

            activeSelectPromotion()
        } else movePiece()
    }

    const movePiece = () => {
        if (!pieceSelected || !target) { return }

        const { position } = dataGame.getPiece(pieceSelected)

        if (!position) { return }

        if (gameControl.movePiece({ position, target, promotion: promotionSelected })) {
            renderControl.newLance()

            renderControl.selectHouse({ position, className: "last-lance-initial" })
            renderControl.selectHouse({ position: target, className: "last-lance-target" })

            renderControl.toggleSide()

            getData()

        }

        cancelMove()
    }

    const cancelMove = () => {
        pieceSelected = null
        promotionSelected = null
        target = null
        isClicked = false
        isSelectPromotion = false

        renderControl.togglePromotions({ value: false })
        renderControl.removeSelectHouse()
    }

    return initComponents()
}

window.onload = App