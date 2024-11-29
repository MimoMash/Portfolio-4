import Labyrinth from "./labyrint.mjs"
import { ANSI } from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;
let splash = null;

function init() {
    splash = new SplashScreen();
    splash.start();

    setTimeout(() => {
    splash.stop();
    state = new Labyrinth();
    intervalID = setInterval(update, REFRESH_RATE);
    }, 3000);
}

function update() {

    if (isBlocked) { return; }
    isBlocked = true;
    //#region core game loop
    state.update();
    state.draw();
    //#endregion
    isBlocked = false;
}

init();