import { ANSI } from "./utils/ANSI.mjs";
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

let NPCPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "ⶆ";
const LOOT = "$";
const NPC = "X";
const TELEPORT = "⛗";
const DOORS = {
    start: "⚀",
    aSharpPlace: "⚁",
    aScaryPlace: "⚂"
}

let direction = -1;
let levelChange = false;
let previousLevel = null;
let currentLevel = startingLevel;
const maxPatrol = 4;
const minPatrol = 0;
let amountOfPatrolsRow = 2;
let amountOfPatrolsCol = 2;
let isPatrolLimitReachedRow = false;
let isPatrolLimitReachedCol = false;
let fullPatrolRow = false;
let patrolCount = 0;
let NPCPositions = [];
let NPCAmount = 0;
let items = [];


const THINGS = [LOOT, EMPTY];
const ENEMY_THINGS = [EMPTY];
const TELEPORTER = [TELEPORT];
const LEVEL_DOORS = [DOORS.start, DOORS.aSharpPlace, DOORS.aScaryPlace]
let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    cash: 0
}

function findNPCOnMap() {
    
    if (NPCPos.row == null) {
        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] == NPC) {
                    NPCAmount++
                    NPCPositions[NPCAmount] = {
                        NPCPosRow: row,
                        NPCPosCol: col,
                    }
                    NPCPos.row = null;
                    break;
                }
            }
            if (NPCPos.row != undefined) {
                break;
            }
        }
    }
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

        function resetNPCPosition () {
            NPCPos.row = null;
            NPCPos.col = null;
            nRow = null;
            nCol = null;
            findNPCOnMap();
            xCol = 0;
            xRow = 0;
            nRow = NPCPos.row + (1 * xRow);
            nCol = NPCPos.col + (1 * xCol);
        }

            
        if (THINGS.includes(level[tRow][tCol])) { // Is there anything where Hero is moving to
            let currentItem = level[tRow][tCol];
            
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventText = `Player gained ${loot}$`;
            }

            if (levelChange == true) {
                level[playerPos.row][playerPos.col] = DOORS[previousLevel];
                level[tRow][tCol] = HERO;
                
                playerPos.row = tRow;
                playerPos.col = tCol;
                
                isDirty = true;
                levelChange = false;

            } else {
                level[playerPos.row][playerPos.col] = EMPTY;
                level[tRow][tCol] = HERO;

                playerPos.row = tRow;
                playerPos.col = tCol;

                isDirty = true;
            }

        } else {
            direction *= -1;
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

        findNPCOnMap();

        let xRow = 0;
        let xCol = 0;

        function NPCPatrolRow() {
            if (patrolCount == 8) {
                patrolCount = 0;
                fullPatrolRow = true;
                return;
            }
            if (amountOfPatrolsRow <= maxPatrol && !isPatrolLimitReachedRow) {
                xRow--
                amountOfPatrolsRow++
                if (amountOfPatrolsRow == maxPatrol)
                    isPatrolLimitReachedRow = true;
            } else if (amountOfPatrolsRow >= minPatrol && isPatrolLimitReachedRow) {
                xRow++
                amountOfPatrolsRow--
                if (amountOfPatrolsRow == minPatrol)
                    isPatrolLimitReachedRow = false;
            } 
            patrolCount++;
        }

        function NPCPatrolCol() {
            if (patrolCount == 8) {
                patrolCount = 0;
                fullPatrolRow = false;
                return;
            }
            if (amountOfPatrolsCol <= maxPatrol && !isPatrolLimitReachedCol) {
                xCol--
                amountOfPatrolsCol++
                if (amountOfPatrolsCol == maxPatrol)
                    isPatrolLimitReachedCol = true;
            } else if (amountOfPatrolsCol >= minPatrol && isPatrolLimitReachedCol) {
                xCol++
                amountOfPatrolsCol--
                if (amountOfPatrolsCol == minPatrol)
                    isPatrolLimitReachedCol = false;
            }   
            patrolCount++;
        }
        
        if (fullPatrolRow == false) {
            NPCPatrolRow();
        } else {
            NPCPatrolCol();
        }

        let nRow = [];
        let nCol = [];

        for (let i = 0; i < NPCAmount; i++) {
            nRow[i] = {
                nRow: NPCPositions[i].NPCPosRow + (1 * xRow)
            }
            nCol[i] = {
                nCol: NPCPositions[i].NPCPosCol + (1 * xCol)
            }
        }


        if (ENEMY_THINGS.includes(level[nRow][nCol])) {
            level[NPCPos.row][NPCPos.col] = EMPTY;
            level[nRow][nCol] = NPC;

            NPCPos.row = nRow;
            NPCPos.col = nCol;  
            isDirty = true;       
        }

    if (LEVEL_DOORS.includes(level[tRow][tCol])) {
        let currentDoor = level[tRow][tCol]
        
            levelChanger(startingLevel);
        
            levelChanger(aSharpPlace);

            levelChanger(aScaryPlace);

            levelChange = true;
            isDirty = true;

            function levelChanger(levelName) {
                if (currentDoor == DOORS[levelName]) {
                    levelData = readMapFile(levels[levelName]);
                    level = levelData;
                    resetPlayerPosition();
                    resetNPCPosition();
                    previousLevel = currentLevel;
                    currentLevel = levelName;
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
        console.log(patrolCount);
        
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