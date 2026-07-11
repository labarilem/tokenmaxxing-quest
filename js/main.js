import { Game } from "./game.js";
import { SystemClock } from "./clock.js";
import { LocalStorageAdapter } from "./storage.js";
import { TICK_MS } from "./resources.js";
import { UI } from "./ui.js";

const game = new Game({
  clock: new SystemClock(),
  storage: new LocalStorageAdapter(),
});
const ui = new UI(game);

/** @type {ReturnType<typeof setInterval> | null} */
let tickInterval = null;

function tick() {
  game.tick();
  ui.update();

  if (game.shouldAutosave()) {
    game.save();
  }
}

function startTickLoop() {
  if (tickInterval !== null) {
    return;
  }
  tickInterval = setInterval(tick, TICK_MS);
}

function stopTickLoop() {
  if (tickInterval === null) {
    return;
  }
  clearInterval(tickInterval);
  tickInterval = null;
}

function onVisibilityChange() {
  if (document.hidden) {
    game.save();
    stopTickLoop();
    return;
  }

  game.applyOfflineProgress();
  ui.update();
  startTickLoop();
}

game.load();
ui.update();
startTickLoop();

document.addEventListener("visibilitychange", onVisibilityChange);

window.addEventListener("beforeunload", () => {
  game.save();
});
