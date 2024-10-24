import { EventEmitter } from 'pixi.js';
import { Deferred } from '../utils/deferred';

type HTMLElementCollection = { [key: string]: HTMLElement | null };
type HTMLButtonCollection = { [key: string]: HTMLButtonElement | null };

export class HTMLUIController extends EventEmitter {
  protected _initialized: boolean = false;

  public buttons: HTMLButtonCollection = {};
  public displays: HTMLElementCollection = {};

  public init() {
    if (this._initialized) return this;
    this._initialized = true;

    this.buttons.newGame = document.querySelector('#button-new-game');
    this.buttons.restartGame = document.querySelector('#button-restart-game');
    this.buttons.winGame = document.querySelector('#button-win-game');
    this.buttons.undo = document.querySelector('#button-undo');
    this.buttons.muteAudio = document.querySelector('#button-mute-audio');
    this.buttons.startTimer = document.querySelector('#button-start-timer');
    this.buttons.pauseTimer = document.querySelector('#button-pause-timer');
    this.buttons.unpauseTimer = document.querySelector('#button-unpause-timer');

    this.displays.timer = document.querySelector('#display-timer');
    this.displays.moves = document.querySelector('#metric-value-moves');
    this.displays.stock = document.querySelector('#metric-value-stock');
    this.displays.passthrus = document.querySelector('#metric-value-passthrus');
    document.querySelector('#metrics-passthrus');

    if (this.buttons.winGame)
      this.buttons.winGame.addEventListener('pointerdown', () =>
        this.closeWinOverlay()
      );

    this.disable();

    return this;
  }

  public async start() {
    const gameContainer = document.querySelector(
      '.game_container'
    ) as HTMLElement;
    if (gameContainer) gameContainer.style.opacity = '1';
    const deferred = new Deferred();
    setTimeout(() => {
      deferred.resolve(null);
    }, 250);
    await deferred.promise;
  }

  public updateDisplay(displayId: string, content: string) {
    const display = this.displays[displayId];
    if (!display) return;
    display.innerHTML = content;
  }

  public openWinOverlay() {
    const overlay = document.querySelector('#win_overlay') as HTMLElement;
    if (overlay === null) return;

    overlay.style.visibility = 'inherit';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';

    if (this.buttons.winGame) this.buttons.winGame.disabled = false;
  }

  public closeWinOverlay() {
    const overlay = document.querySelector('#win_overlay') as HTMLElement;
    if (overlay === null) return;

    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }

  public disable() {
    for (const name in this.buttons) {
      const button = this.buttons[name];
      if (button !== null) {
        button.disabled = true;
      }
    }
  }

  public enable() {
    for (const name in this.buttons) {
      const button = this.buttons[name];
      if (button !== null) {
        button.disabled = false;
      }
    }
  }

  public reset() {}
}
