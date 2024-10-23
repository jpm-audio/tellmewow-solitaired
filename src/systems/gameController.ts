import { Application, Assets, EventEmitter } from 'pixi.js';
import ActionsHandler, { Action } from './actionsHandler';
import { SolitaireScene } from '../scenes/solitaireScene';
import debounce from '../utils/debounce';
import { StateHandler } from './stateHandler';
import { Actions, Decks } from '../constants/cards';
import { HTMLUIController } from './HTMLUIController';
import { Timer } from './timer';

export class GameController extends EventEmitter {
  public resolution: number = 1;
  protected _initialized: boolean = false;
  protected _timer: Timer | null = null;
  protected _htmlUIController: HTMLUIController | null = null;
  protected _actionsHandler: ActionsHandler | null = null;
  protected _stateHandler: StateHandler | null = null;
  protected _app: Application;
  protected _scene: SolitaireScene | null = null;

  constructor(pixiApp: Application) {
    super();
    this._app = pixiApp;
  }

  private _handleResize() {
    const onResize = () => {
      this._app.resize();
      this._scene?.updateSize(this._app);
    };

    window.addEventListener('resize', debounce(onResize, 300));

    onResize();
  }

  private async _initView() {
    // Load assets
    Assets.add([
      {
        alias: 'main',
        src: `/assets/sprites/main-0${
          this.resolution === 1 ? '' : `x${this.resolution}`
        }.json`,
      },
    ]);
    await Assets.load(['main']);

    // Start scene
    this._scene = new SolitaireScene();
    this._app.stage.addChild(this._scene);

    await this._scene.init(this);

    // Resize Handling
    this._handleResize();

    // Init HTML UI
    this._htmlUIController = new HTMLUIController().init();

    // Init Timer
    this._timer = new Timer(this._htmlUIController).init(this._app.ticker, 250);
    this._timer.on('timeupdate', (time) => {
      this._stateHandler?.setState({ timeElapsed: time });
    });
  }

  private _initActions() {
    this._actionsHandler = new ActionsHandler('moves').init();

    // SUBSCRIBE ACTIONS
    this._actionsHandler.subscribeAction({
      id: 'deal',
      callback: async () => {
        await this._scene?.deckDealer?.deal();
      },
    });
    this._actionsHandler.subscribeAction({
      id: 'redeal',
      callback: async () => {
        await this._scene?.deckDealer?.redeal();
      },
    });
    this._actionsHandler.subscribeAction({
      id: 'move',
      callback: async (action: Action) => {
        console.log(action);
      },
    });
    this._actionsHandler.on('reset', () => {
      this._scene?.shuffle();
    });

    // EVENTS EXECUTION
    this._scene?.deckDealer?.on('stock.pointerdown', (deckDealer) => {
      const isDeal = deckDealer.stock.numCards > 0;
      const actionInfo = isDeal
        ? {
            action: 'deal' as Actions,
            card: deckDealer.stock.topCard().info,
            from: {
              deck: 'stock' as Decks,
              pile: 0,
              position: deckDealer.stock.numCards - 1,
            },
            to: {
              deck: 'waste' as Decks,
              pile: 1,
              position: deckDealer.waste.numCards,
            },
          }
        : {
            action: 'redeal' as Actions,
          };
      this._actionsHandler?.do(actionInfo);
    });
  }

  private _initState() {
    this._stateHandler = new StateHandler('gameState').init();
  }

  public async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Init View
    await this._initView();

    // Init Actions
    this._initActions();

    // Init State
    this._initState();

    // Start Game
    this._scene?.shuffle();

    // Enable the Game
    this._htmlUIController?.enable();
    this._scene?.enable();
  }
}
