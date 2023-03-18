import dataGame from "../data/data-game.js"
import { ILance, IMove, IAction, IPiece, BoardCoordinates, TypeAction, TypeMove, TypeActionArray } from "../model/model-game.js"
import generatedId from "../util/generated-id.js"

export default function HistoryControl() {

    // Lance
    const createLance = ({ moves }: { moves: IMove[] }) => {
        const lance: ILance = {
            id: generatedId(),
            moves
        }

        addLance({ lance })

        return lance
    }

    const getLance = ({ id }: { id?: String }) => {
        return dataGame.getLance({ id })
    }

    const addLance = ({ lance }: { lance: ILance }) => {
        return dataGame.addLance({ lance })
    }

    const removeLance = ({ id }: { id?: String }) => {
        return dataGame.removeLance({ id })
    }

    // Move
    const createMove = ({ actions: ac, typeMove: type, idLance }: { actions: TypeActionArray, typeMove: TypeMove, idLance?: String }) => {
        const actions: IAction[] = []

        ac.forEach(a => {
            actions.push(createAction(a))
        })

        const move: IMove = {
            id: generatedId(),
            actions,
            type
        }

        if (!idLance) {
            if (dataGame.data.historical.length == 0 || dataGame.data.historical[dataGame.data.historical.length - 1].moves.length == 2) {
                const lance = createLance({ moves: [] })

                idLance = lance.id
            }
        }

        addMove({ move, idLance })

        return move
    }

    const getMove = ({ id, idLance }: { id?: String, idLance?: String }) => {
        return dataGame.getMove({ id, idLance })
    }

    const addMove = ({ move, idLance }: { move: IMove, idLance?: String }) => {
        return dataGame.addMove({ move, idLance })
    }

    const removeMove = ({ id, idLance }: { id?: String, idLance?: String }) => {
        return dataGame.removeMove({ id, idLance })
    }

    const createAction = ({ piece, position, type, target, isMain }: { piece: IPiece, position: BoardCoordinates, type: TypeAction, target?: BoardCoordinates, isMain: Boolean }) => {
        const action: IAction = {
            id: generatedId(),
            piece,
            position,
            type,
            target,
            isMain
        }

        return action
    }

    return {
        getLance,
        createLance,
        removeLance,
        addLance,
        createMove,
        getMove,
        addMove,
        removeMove,
    }
}