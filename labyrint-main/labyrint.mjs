import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";


const startingLevel = CONST.START_LEVEL_ID;
const aSharpPlace = CONST.A_SHARP_PLACE_LEVEL_ID;
const aScaryPlace = CONST.A_SCARY_PLACE_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[startingLevel]);
let level = levelData;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "ⶆ": ANSI.COLOR.YELLOW,
    "$": ANSI.COLOR.GREEN,
    "B": ANSI.COLOR.RED,
    "⚀": ANSI.COLOR.BLUE,
    "⚁": ANSI.COLOR.BLUE,
    "⚂": ANSI.COLOR.BLUE,
    "⛗": ANSI.COLOR.BLACK,
}

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "ⶆ";
const LOOT = "$";
const TELEPORT = "⛗";
const DOORS = {
    start: "⚀",
    aSharpPlace: "⚁",
    aScaryPlace: "⚂"
}

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY];
const TELEPORTER = [TELEPORT]
const LEVEL_DOORS = [DOORS.start, DOORS.aSharpPlace, DOORS.aScaryPlace]
let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

class Labyrinth {

    update() {

        findHeroOnMap();

        let dRow = 0;
        let dCol = 0;

        
        if (KeyBoardManager.isUpPressed()) {
            dRow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            dRow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dCol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dCol = 1;
        }

        let tRow = playerPos.row + (1 * dRow);
        let tCol = playerPos.col + (1 * dCol);

        function resetPlayerPosition () {
            playerPos.row = null;
            playerPos.col = null;
            tRow = null;
            tCol = null;
            findHeroOnMap();
            dCol = 0;
            dRow = 0;
            tRow = playerPos.row + (1 * dRow);
            tCol = playerPos.col + (1 * dCol);
        }

        
        if (THINGS.includes(level[tRow][tCol])) { // Is there anything where Hero is moving to
            let currentItem = level[tRow][tCol];
            
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained ${loot}$`;
            }

            

            
            // Move the HERO
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;

            // Update the HERO
            playerPos.row = tRow;
            playerPos.col = tCol;

            // Make the draw function draw.
            isDirty = true;
        } else {
            direction *= -1;
        }

        if (LEVEL_DOORS.includes(level[tRow][tCol])) {
            let currentDoor = level[tRow][tCol]

                if (currentDoor == DOORS.aSharpPlace) {
                    levelData = readMapFile(levels[aSharpPlace]);
                    level = levelData;
                    resetPlayerPosition();
                    isDirty = true;
                }

                if (currentDoor == DOORS.aScaryPlace) {
                    levelData = readMapFile(levels[aScaryPlace]);
                    level = levelData;
                    resetPlayerPosition();
                    isDirty = true;
                }

        }

        if (TELEPORTER.includes(level[tRow][tCol])) {
            let currentItem = level[tRow][tCol];

            if (currentItem == TELEPORT) {
                teleportPlayer();
            }
            isDirty = true;
        }

        function teleportPlayer() {
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = EMPTY;
            playerPos.row = null;
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == TELEPORT) {
                        level[row][col] = HERO;
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }

    }
    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `${ANSI.COLOR.GREEN + "$" + ANSI.COLOR_RESET}:${playerStats.cash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}

function findHeroOnMap() {
    if (playerPos.row == null) {
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] == HERO) {
                    playerPos.row = row;
                    playerPos.col = col;
                    break;
                }
            }
            if (playerPos.row != undefined) {
                break;
            }
        }
    }
}

export default Labyrinth;