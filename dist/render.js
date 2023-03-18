import dataGame from "./data/data-game.js";
import generatedId from "./util/generated-id.js";
export default function ControlRender() {
    const ELEMENTS = {
        board: document.querySelector(".board"),
        promotions: document.querySelector(".type-promotions")
    };
    const initComponents = () => {
        ELEMENTS.board = document.querySelector(".board");
        if (!ELEMENTS.board) {
            return;
        }
        ELEMENTS.board.innerHTML = "";
        createBoard();
        toggleSide();
    };
    const getPieceImg = ({ type, side }) => {
        const pieceImg = new Image();
        pieceImg.src = `public/${(type.charAt(0) + side.charAt(0)).toLowerCase()}.png`;
        return pieceImg;
    };
    const createBoard = () => {
        const { board } = dataGame.data;
        let isWhite = false;
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                const piece = board[i][j];
                const house = createHouse(isWhite, ELEMENTS.board, [{ key: "position-x", value: `${i}` }, { key: "position-y", value: `${j}` }]);
                isWhite = !isWhite;
                if (!piece) {
                    continue;
                }
                const pieceEl = createPiece(piece);
                appendEl(house, pieceEl);
            }
            isWhite = !isWhite;
        }
    };
    const appendEl = (parent, children) => {
        if (!parent) {
            return;
        }
        parent.appendChild(children);
    };
    const createHouse = (isWhite = false, board, attr) => {
        const house = document.createElement("div");
        house.classList.add("house", isWhite ? "white" : "black");
        attr.forEach(att => {
            house.setAttribute(att.key, att.value);
        });
        appendEl(board, house);
        return house;
    };
    const createPiece = (piece) => {
        const pieceEl = document.createElement("div");
        pieceEl.classList.add("piece", piece.type, piece.side);
        pieceEl.id = `${piece.id}`;
        pieceEl.setAttribute("id", `${piece.id}`);
        appendEl(pieceEl, getPieceImg(piece));
        return pieceEl;
    };
    const movePiece = ({ id, target }) => {
        const pieceEl = document.querySelector('[id="' + id + '"]');
        if (!pieceEl) {
            return;
        }
        const houseEl = document.querySelector(`[position-x="${target.x}"][position-y="${target.y}"]`);
        if (!houseEl) {
            return;
        }
        houseEl.innerHTML = "";
        appendEl(houseEl, pieceEl);
    };
    const updatePiece = ({ piece }) => {
        console.log(piece.id);
        const pieceEl = document.querySelector('[id="' + piece.id + '"]');
        const img = pieceEl?.querySelector("img");
        if (pieceEl) {
            pieceEl.className = `piece ${piece.type} ${piece.side}`;
        }
        img?.setAttribute("src", `public/${(piece.type.charAt(0) + piece.side.charAt(0)).toLowerCase()}.png`);
    };
    const removePiece = ({ piece }) => {
        const pieceEl = document.querySelector('[id="' + piece.id + '"]');
        if (!pieceEl) {
            return;
        }
        pieceEl.remove();
    };
    const newLance = () => {
        const { move } = dataGame.getMove({});
        if (!move) {
            return;
        }
        move.actions.forEach(({ piece, type, target, typePromotion }) => {
            if (type == "death") {
                return removePiece({ piece });
            }
            if (type == "move" && target) {
                return movePiece({ ...piece, target });
            }
            if (type == "promotion" || typePromotion) {
                return updatePiece({ piece });
            }
        });
    };
    const selectHouse = ({ position, className = "selected" }) => {
        const houseEl = document.querySelector(`[position-x="${position.x}"][position-y="${position.y}"]`);
        if (!houseEl) {
            return;
        }
        document.querySelectorAll(`.house.${className}`).forEach(el => el.classList.remove(className));
        houseEl.classList.add(className);
    };
    const removeSelectHouse = () => {
        const houseEl = document.querySelector(".house.selected");
        if (!houseEl) {
            return;
        }
        houseEl.classList.remove("selected");
    };
    const openTypePromotions = () => {
        let isWhite = true;
        if (ELEMENTS.promotions) {
            ELEMENTS.promotions.innerHTML = "";
        }
        const typePromotions = ["queen", "rook", "bishop", "horse"];
        const houses = typePromotions.map(pi => {
            isWhite = !isWhite;
            return { el: createHouse(isWhite, ELEMENTS.promotions, [{ key: "type-promotion", value: pi }]), type: pi };
        });
        return houses;
    };
    const togglePromotions = ({ side = "white", value }) => {
        if (value) {
            openTypePromotions().forEach(house => {
                appendEl(house.el, createPiece({ id: generatedId(), isMoved: false, side, type: house.type }));
            });
        }
        else {
            if (ELEMENTS.promotions) {
                ELEMENTS.promotions.innerHTML = "";
            }
        }
        ELEMENTS.promotions?.classList.toggle("active", value);
    };
    const toggleSide = () => {
        ELEMENTS.board?.classList.toggle("white", dataGame.data.sideTime == "white");
        ELEMENTS.board?.classList.toggle("black", dataGame.data.sideTime == "black");
    };
    return {
        initComponents,
        movePiece,
        selectHouse,
        removeSelectHouse,
        toggleSide,
        togglePromotions,
        newLance,
    };
}
