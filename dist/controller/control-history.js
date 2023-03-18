import dataGame from "../data/data-game.js";
import generatedId from "../util/generated-id.js";
export default function HistoryControl() {
    const createLance = ({ moves }) => {
        const lance = {
            id: generatedId(),
            moves
        };
        addLance({ lance });
        return lance;
    };
    const getLance = ({ id }) => {
        return dataGame.getLance({ id });
    };
    const addLance = ({ lance }) => {
        return dataGame.addLance({ lance });
    };
    const removeLance = ({ id }) => {
        return dataGame.removeLance({ id });
    };
    const createMove = ({ actions: ac, typeMove: type, idLance }) => {
        const actions = [];
        ac.forEach(a => {
            actions.push(createAction(a));
        });
        const move = {
            id: generatedId(),
            actions,
            type
        };
        if (!idLance) {
            if (dataGame.data.historical.length == 0 || dataGame.data.historical[dataGame.data.historical.length - 1].moves.length == 2) {
                const lance = createLance({ moves: [] });
                idLance = lance.id;
            }
        }
        addMove({ move, idLance });
        return move;
    };
    const getMove = ({ id, idLance }) => {
        return dataGame.getMove({ id, idLance });
    };
    const addMove = ({ move, idLance }) => {
        return dataGame.addMove({ move, idLance });
    };
    const removeMove = ({ id, idLance }) => {
        return dataGame.removeMove({ id, idLance });
    };
    const createAction = ({ piece, position, type, target, isMain }) => {
        const action = {
            id: generatedId(),
            piece,
            position,
            type,
            target,
            isMain
        };
        return action;
    };
    return {
        getLance,
        createLance,
        removeLance,
        addLance,
        createMove,
        getMove,
        addMove,
        removeMove,
    };
}
