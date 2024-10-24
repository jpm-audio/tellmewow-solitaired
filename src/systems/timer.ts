import { EventEmitter, Ticker } from 'pixi.js';
import { HTMLUIController } from './HTMLUIController';

type TimerState = 'stopped' | 'paused' | 'running';

export class Timer extends EventEmitter {
  protected _initialized: boolean = false;
  protected _isRunning: boolean = false;
  protected _isPaused: boolean = false;
  protected _viewController: HTMLUIController;
  protected _ticker: Ticker | null = null;
  protected _elapsedTime: number = 0;
  protected _interval: number = 1000;
  protected _lastTime: number = 0;

  public get time() {
    return this._elapsedTime;
  }

  public set time(value: number) {
    this._elapsedTime = value;
    this.updateDisplayTime();
  }

  public get state(): TimerState {
    if (this._isPaused) return 'paused';
    if (this._isRunning) return 'running';
    return 'stopped';
  }

  constructor(viewController: HTMLUIController) {
    super();
    this._viewController = viewController;
  }

  protected _updateTime() {
    if (this._isPaused) return;
    const now = Date.now();
    const elapsedTime = now - this._lastTime;
    if (elapsedTime < this._interval) return;
    this._lastTime = now;
    this.time = this.time + elapsedTime;
    this.emit('timeupdate', this.time);
  }

  protected _updateViewState() {
    const startTimerButton = this._viewController.buttons.startTimer;
    const pauseTimerButton = this._viewController.buttons.pauseTimer;
    const unpauseTimerButton = this._viewController.buttons.unpauseTimer;

    if (startTimerButton && pauseTimerButton && unpauseTimerButton) {
      startTimerButton.style.display = this._isRunning
        ? 'none'
        : 'inline-block';
      pauseTimerButton.style.display =
        this._isRunning && !this._isPaused ? 'inline-block' : 'none';
      unpauseTimerButton.style.display = this._isPaused
        ? 'inline-block'
        : 'none';
    }
  }

  public init(ticker: Ticker, interval: number = 1000): Timer {
    if (this._initialized) return this;
    this._initialized = true;
    this._ticker = ticker;
    this._interval = interval;

    // Start
    this._viewController.buttons.startTimer?.addEventListener(
      'pointerdown',
      () => this.start()
    );
    //Pause
    this._viewController.buttons.pauseTimer?.addEventListener(
      'pointerdown',
      () => this.pause()
    );
    //Unpause
    this._viewController.buttons.unpauseTimer?.addEventListener(
      'pointerdown',
      () => this.resume()
    );

    return this;
  }

  public start() {
    if (!this._initialized || this._isRunning) return;
    this._isRunning = true;
    this._lastTime = Date.now();
    this.time = 0;
    this._ticker?.add(this._updateTime, this);
    this._updateViewState();
  }

  public pause() {
    if (!this._isRunning || this._isPaused) return;
    this._isPaused = true;
    this._updateViewState();
  }

  public resume() {
    if (!this._isRunning || !this._isPaused) return;
    this._lastTime = Date.now();
    this._isPaused = false;
    this._updateViewState();
  }

  public stop() {
    if (!this._isRunning) return;
    this._isRunning = false;
    this._ticker?.remove(this._updateTime, this);
    this.reset();
  }

  public reset() {
    this._isPaused = false;
    this.time = 0;
    this._updateViewState();
  }

  public updateDisplayTime() {
    const display = this._viewController.displays.timer;
    if (display) {
      const timeSecs = Math.round(this._elapsedTime / 1000);
      const min = Math.floor(timeSecs / 60);
      const secs = timeSecs % 60;
      const minString = min.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        minimumIntegerDigits: 2,
      });
      const secString = secs.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        minimumIntegerDigits: 2,
      });
      display.innerHTML = `${minString}:${secString}`;
    }
  }
}
