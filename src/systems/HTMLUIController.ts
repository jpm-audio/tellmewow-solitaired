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
