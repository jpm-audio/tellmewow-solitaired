import { Application, Assets, EventEmitter } from 'pixi.js';
import ActionsHandler, { ActionRegister, CardLocation } from './actionsHandler';
import { SolitaireScene } from '../scenes/solitaireScene';
import { StateHandler, StatsState } from './stateHandler';
import { Actions } from '../constants/cards';
import { HTMLUIController } from './HTMLUIController';
import { Timer } from './timer';
import { CardInfo } from '../components/card';
import debounce from '../utils/debounce';
import { AudioController } from './audioController';
import { GameEvents } from '../constants/gameEvents';
import { GAME_CONFIG } from '../constants/gameConfig';
import { SceneBuilderTurn1 } from '../scenes/sceneBuilderTurn1';
import SceneBuilder from '../scenes/sceneBuilder';
import { GameAction } from '../scenes/gameActions';

export class Game extends EventEmitter {
  private static _instance: null | Game = null;
  private static _bus: null | EventEmitter = null;
  public resolution: number = 1;
  protected _initialized: boolean = false;
  protected _timer!: Timer;
  protected _htmlUIController!: HTMLUIController;
  protected _actionsHandler!: ActionsHandler;
  protected _stateHandler!: StateHandler;
  protected _app!: Application;
  protected _scene!: SolitaireScene;
  protected _stats: StatsState = {
    moves: 0,
    stock: 0,
    passthrus: 0,
  };
  protected _audio!: AudioController;

  public static get bus() {
    if (Game._bus === null) Game._bus = new EventEmitter();
    return Game._bus;
  }

  public static get game() {
    if (Game._instance === null) Game._instance = new Game();
    return Game._instance;
  }

  private constructor() {
    super();
  }

  private _handleResize() {
    const onResize = () => {
      this._app.resize();
      this._scene.updateSize(this._app);
    };

    window.addEventListener('resize', debounce(onResize, 300));

    onResize();
  }

  private async _initView() {
    // Load assets
    Assets.add([
      {
        alias: 'main',
        src: `${GAME_CONFIG.spritesBasePath}${
          this.resolution === 1 ? '' : `x${this.resolution}`
        }.json`,
      },
    ]);
    await Assets.load(['main']);

    // Start scene
    this._scene = new SolitaireScene();
    this._app.stage.addChild(this._scene);

    const sceneBuilder = new SceneBuilderTurn1();
    await this._scene.init(sceneBuilder);
    this._initActions(sceneBuilder);
    // TODO - When changing game type, reset the actions
    // this._actionsHandler.reset();

    // Resize Handling
    this._handleResize();

    // Init HTML UI
    this._htmlUIController = new HTMLUIController().init();

    // Init Timer
    this._timer = new Timer(this._htmlUIController).init(this._app.ticker, 250);
    this._timer.on('timeupdate', (time) => {
      this._stateHandler.setState({ timeElapsed: time });
    });
  }

  private async _initAudio() {
    this._audio = new AudioController();
    await this._audio.init(GAME_CONFIG.audioBasePath);
    this._audio.setActions();
  }

  private _initActions(sceneBuilder: SceneBuilder) {
    // SUBSCRIBE SPECIFIC ACTIONS FROM SCENE BUILDER
    sceneBuilder.gameActions.forEach((gameAction: GameAction) => {
      this._actionsHandler.subscribeAction({
        id: gameAction.id,
        callback: async (actionRegister: ActionRegister) => {
          this.disable();
          await gameAction.callback(actionRegister, sceneBuilder);
          this.enable();

          this._stats.moves += gameAction.moveAdd;
          this._stats.passthrus += gameAction.passthrusAdd;

          this.updateGameState();
        },
      });
    });

    //SUBSCRIBE GENERAL ACTIONS FROM GAME
    this._actionsHandler.subscribeAction({
      id: 'move',
      callback: async (actionRegister: ActionRegister) => {
        if (actionRegister.undo) {
          // Inverse from & to for undoing action
          //!\\ undoFrom need "position + 1" to refer to the card that was set with the action.
          const undoFrom = actionRegister.to as CardLocation;
          const undoTo = actionRegister.from as CardLocation;
          await this._scene.moveCards(
            { ...undoFrom, position: undoFrom.position + 1 },
            undoTo,
            actionRegister.hostCard?.turn as boolean
          );
        }

        this._stats.moves += 1;
        this.updateGameState();
      },
    });
  }

  private _initState() {
    this._stateHandler = new StateHandler('gameState').init();
  }

  private _initEvents() {
    this._scene.on('onDragStart', this._onPlayerPlaying, this);
    this._scene.on('onDragEnd', this._onPlayerEndMove, this);
    this._stateHandler.on('stateChange', this.onStatsChange, this);
    Game.bus.on(GameEvents.WIN, this._winGame, this);

    // Buttons
    if (!this._htmlUIController.buttons) return;
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
          this._actionsHandler.undo();
        }
      );

    if (this._htmlUIController.buttons.winGame)
      this._htmlUIController.buttons.winGame.addEventListener(
        'pointerdown',
        () => this._newGame()
      );
  }

  private _onAction(action: ActionRegister) {
    this._actionsHandler.do(action);
    this._onPlayerPlaying();
  }

  private _onPlayerPlaying() {
    if (this._timer.state === 'stopped') {
      this._timer.start();
    } else {
      this._timer.resume();
    }
  }

  private async _onPlayerEndMove(
    cardInfo: CardInfo,
    cardFrom: CardLocation,
    cardTo: CardLocation,
    hasHostCard2Turn: boolean
  ) {
    // Update Stats
    await this._actionsHandler.do({
      action: 'move' as Actions,
      card: cardInfo,
      hostCard: { turn: hasHostCard2Turn },
      from: cardFrom,
      to: cardTo,
    });
  }

  private _setGameFromState() {
    const currentState = this._stateHandler.state;
    const elapsedTime = currentState.timeElapsed;

    // Update Timer
    this._timer.time = elapsedTime;

    // Update Stats
    this._stats.moves = currentState.stats.moves;
    this._stats.stock = currentState.stats.stock;
    this._stats.passthrus = currentState.stats.passthrus;
    this.onStatsChange();

    // Set the game state
    this._scene.setGame(currentState);
  }

  private _newGame() {
    if (!this._scene) return;
    this.disable();
    this._timer.stop();
    this._timer.reset();
    this._stats.moves = 0;
    this._stats.stock = 0;
    this._stats.passthrus = 0;
    this._scene.newGame();
    this.updateGameState();
    this._stateHandler.saveInitalState();
    this._actionsHandler.reset();
    this.enable();
  }

  private _restartGame() {
    if (!this._scene) return;
    this.disable();
    this._timer.stop();
    this._timer.reset();
    this._stats.moves = 0;
    this._stats.stock = 0;
    this._stats.passthrus = 0;
    this._scene.reset();
    this._stateHandler.loadInitialState();
    this._setGameFromState();
    this._actionsHandler.reset();
    this.enable();
  }

  private _winGame() {
    this.disable();
    this._htmlUIController.openWinOverlay();
  }

  public async init(pixiApp: Application) {
    if (this._initialized) return;
    this._initialized = true;

    this._app = pixiApp;

    // Init Actions
    this._actionsHandler = new ActionsHandler('actions').init();
    Game.bus.on(GameEvents.ACTION, this._onAction, this);
    // Init State
    this._initState();
    // Init View
    await this._initView();
    // Init Audio
    await this._initAudio();

    // Start or Set a Game
    if (this._stateHandler.hasGameSet) {
      this._setGameFromState();
    } else {
      this._newGame();
    }

    // Enable the Game
    await this._htmlUIController.start();

    // Events
    this._initEvents();

    this.enable();
  }

  public updateGameState() {
    if (!this._timer || !this._stateHandler || !this._scene) return;

    // Update Stats
    this._stats.stock = this._scene.stock;

    this._stateHandler.setState({
      timeElapsed: this._timer.time,
      stats: {
        moves: this._stats.moves,
        stock: this._stats.stock,
        passthrus: this._stats.passthrus,
      },
      cards: this._scene.info,
    });
  }

  public onStatsChange() {
    if (!this._stateHandler) return;
    this._htmlUIController.updateDisplay(
      'moves',
      this._stateHandler.state.stats.moves.toString()
    );
    this._htmlUIController.updateDisplay(
      'stock',
      this._stateHandler.state.stats.stock.toString()
    );
    this._htmlUIController.updateDisplay(
      'passthrus',
      this._stateHandler.state.stats.passthrus.toString()
    );
  }

  public enable() {
    this._htmlUIController.enable();
    this._scene.enable();
  }

  public disable() {
    this._htmlUIController.disable();
    this._scene.disable();
  }
}
