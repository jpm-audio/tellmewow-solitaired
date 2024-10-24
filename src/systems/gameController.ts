import { Application, Assets, EventEmitter } from 'pixi.js';
import ActionsHandler, { ActionRegister, CardLocation } from './actionsHandler';
import { SolitaireScene } from '../scenes/solitaireScene';
import debounce from '../utils/debounce';
import { StateHandler, StatsState } from './stateHandler';
import { Actions, Decks } from '../constants/cards';
import { HTMLUIController } from './HTMLUIController';
import { Timer } from './timer';
import { CardInfo } from '../components/card';

export class GameController extends EventEmitter {
  public resolution: number = 1;
  protected _initialized: boolean = false;
  protected _timer: Timer | null = null;
  protected _htmlUIController: HTMLUIController | null = null;
  protected _actionsHandler: ActionsHandler | null = null;
  protected _stateHandler: StateHandler | null = null;
  protected _app: Application;
  protected _scene: SolitaireScene | null = null;
  protected _stats: StatsState = {
    moves: 0,
    stock: 0,
    passthrus: 0,
  };

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

    await this._scene.init();

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
      callback: async (actionRegister: ActionRegister) => {
        if (actionRegister.undo) {
          this.disable();
          await this._scene?.deckDealer?.undeal();
          this.enable();
        } else {
          await this._scene?.deckDealer?.deal();
        }

        // Update Stats
        this._stats.moves += 1;
        if (!this._scene || !this._scene?.deckDealer) return;
        const stockDeck = this._scene?.deckDealer?.getPile(0);
        if (!stockDeck) return;
        this._stats.stock = stockDeck.numCards;

        this.updateGameState();
      },
    });
    this._actionsHandler.subscribeAction({
      id: 'redeal',
      callback: async (actionRegister: ActionRegister) => {
        if (!this._scene || !this._scene?.deckDealer) return;

        if (actionRegister.undo) {
          this.disable();
          await this._scene?.deckDealer?.unredeal();
          this.enable();
        } else {
          await this._scene?.deckDealer?.redeal();
        }

        const stockDeck = this._scene?.deckDealer?.getPile(0);

        // Update Stats
        this._stats.moves += 1;
        this._stats.passthrus += 1;
        if (!stockDeck) return;
        this._stats.stock = stockDeck.numCards;
        this.updateGameState();
      },
    });
    this._actionsHandler.subscribeAction({
      id: 'move',
      callback: async (actionRegister: ActionRegister) => {
        if (actionRegister.undo) {
          this.disable();
          await this._scene?.moveCards(
            actionRegister.to as CardLocation,
            actionRegister.from as CardLocation
          );
          this.enable();
        }
        this._stats.moves += 1;
        this.updateGameState();
      },
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
      this._onPlayerPlaying();
    });
  }

  private _initState() {
    this._stateHandler = new StateHandler('gameState').init();
  }

  private _initEvents() {
    this._scene?.on('onDragStart', this._onPlayerPlaying, this);
    this._scene?.on('onDragEnd', this._onPlayerEndMove, this);
    this._stateHandler?.on('stateChange', this.onStatsChange, this);

    // Buttons
    if (!this._htmlUIController || !this._htmlUIController.buttons) return;
    if (this._htmlUIController.buttons.newGame)
      this._htmlUIController.buttons.newGame.addEventListener(
        'pointerdown',
        () => this._newGame()
      );

    if (this._htmlUIController.buttons.restartGame)
      this._htmlUIController.buttons.restartGame.addEventListener(
        'pointerdown',
        () => this._restartGame()
      );

    if (this._htmlUIController.buttons.undo)
      this._htmlUIController.buttons.undo.addEventListener(
        'pointerdown',
        () => {
          this._actionsHandler?.undo();
        }
      );
  }

  private _onPlayerPlaying() {
    if (this._timer?.state === 'stopped') {
      this._timer?.start();
    } else {
      this._timer?.resume();
    }
  }

  private _onPlayerEndMove(
    cardInfo: CardInfo,
    cardFrom: CardLocation,
    cardTo: CardLocation
  ) {
    // Update Stats
    this._actionsHandler?.do({
      action: 'move' as Actions,
      card: cardInfo,
      from: cardFrom,
      to: cardTo,
    });
  }

  private _setGameFromState() {
    if (!this._stateHandler || !this._timer) return;
    const currentState = this._stateHandler.state;
    const elapsedTime = currentState.timeElapsed;

    // Update Timer
    this._timer.time = elapsedTime;

    // Update Stats
    this._stats.moves = currentState.stats.moves;
    this._stats.stock = currentState.stats.stock;
    this._stats.passthrus = currentState.stats.passthrus;
    this.onStatsChange();

    // Update Dealers
    this._scene?.setCardsState(currentState);
  }

  private _newGame() {
    if (!this._scene) return;
    this.disable();
    this._timer?.stop();
    this._timer?.reset();
    this._stats.moves = 0;
    this._stats.stock = 0;
    this._stats.passthrus = 0;
    this._scene.shuffle();
    this.updateGameState();
    this._stateHandler?.saveInitalState();
    this._actionsHandler?.reset();
    this.enable();
  }

  private _restartGame() {
    if (!this._scene || !this._stateHandler) return;
    this.disable();
    this._timer?.stop();
    this._timer?.reset();
    this._stats.moves = 0;
    this._stats.stock = 0;
    this._stats.passthrus = 0;
    this._scene.reset();
    this._stateHandler.loadInitialState();
    this._setGameFromState();
    this._actionsHandler?.reset();
    this.enable();
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

    // Start or Set a Game
    if (this._stateHandler?.hasGameSet) {
      this._setGameFromState();
    } else {
      this._newGame();
    }

    // Enable the Game
    await this._htmlUIController?.start();

    // Events
    this._initEvents();

    this.enable();
  }

  public updateGameState() {
    if (
      !this._timer ||
      !this._stateHandler ||
      !this._scene ||
      !this._scene.foundationsDealer ||
      !this._scene.tableuDealer ||
      !this._scene.deckDealer
    )
      return;

    this._stateHandler.setState({
      timeElapsed: this._timer.time,
      stats: {
        moves: this._stats.moves,
        stock: this._stats.stock,
        passthrus: this._stats.passthrus,
      },
      cards: {
        dealer: this._scene.deckDealer?.info,
        foundations: this._scene.foundationsDealer?.info,
        tableu: this._scene.tableuDealer?.info,
      },
    });
  }

  public onStatsChange() {
    if (!this._stateHandler) return;
    this._htmlUIController?.updateDisplay(
      'moves',
      this._stateHandler.state.stats.moves.toString()
    );
    this._htmlUIController?.updateDisplay(
      'stock',
      this._stateHandler.state.stats.stock.toString()
    );
    this._htmlUIController?.updateDisplay(
      'passthrus',
      this._stateHandler.state.stats.passthrus.toString()
    );
  }

  public enable() {
    this._htmlUIController?.enable();
    this._scene?.enable();
  }

  public disable() {
    this._htmlUIController?.disable();
    this._scene?.disable();
  }
}
