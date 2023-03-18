import dataGame from "../data/data-game.js";
import generatedId from "../util/generated-id.js";
export default function HistoryControl() {
    const getLance = ({ id, index }) => {
        return dataGame.getLance({ id, index });
    };
    const createLance = ({ lances }) => {
        const lance = {
            id: generatedId(),
            lances
        };
        dataGame.addHistory({ lance });
        return lance;
    };
    const removeLance = ({ lance }) => {
        return dataGame.removeLance({ lance });
    };
    return {
        getLance,
        createLance,
        removeLance,
    };
}
