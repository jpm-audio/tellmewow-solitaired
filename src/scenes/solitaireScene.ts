import { Application, Container, Sprite, Texture } from 'pixi.js';
import Card from '../components/card';
import CARD_SUITS, { Actions, Decks } from '../constants/cards';
import GameController, { GameAction } from '../systems/gameController';
import { DeckDealer } from '../components/deckDealer';
import { FoundationsDealer } from '../components/foundationsDealer';
import { TableuDealer } from '../components/tableuDealer';

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  private _config = {
    backTexture: 'back_red.png',
    baseTexture: 'card_base-2.png',
    baseLogoTexture: 'logo-black.png',
    frame: { width: 1850, height: 1150 },
    card: { width: 254, height: 367 },
    decksGap: 4,
    decksOffset: { tableu: { x: 0, y: 65 } },
    cardScale: 1,
    fundations: 4,
    tableuCols: 7,
  };
  private _gameController: GameController | null = null;
  private _cards: Card[] = [];
  private _deckDealer: DeckDealer | null = null;
  private _foundationsDealer: FoundationsDealer | null = null;
  private _tableuDealer: TableuDealer | null = null;

  constructor() {
    super();
  }

  public async init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this._config.cardScale =
      this._config.card.height / Texture.from(this._config.backTexture).height;

    // CARDS
    this._createCards();

    // DECK DEALERS
    this._createDecks();

    // GAME CONTROLLER
    this._gameController = new GameController('moves').init();

    // SUBSCRIBE ACTIONS
    this._gameController.subscribeAction({
      id: 'deal',
      callback: async () => {
        await this._deckDealer?.deal();
      },
    });
    this._gameController.subscribeAction({
      id: 'redeal',
      callback: async () => {
        await this._deckDealer?.redeal();
      },
    });
    this._gameController.subscribeAction({
      id: 'move',
      callback: async (action: GameAction) => {
        console.log(action);
      },
    });

    // EVENTS EXECUTION
    this._deckDealer?.on('stock.pointerdown', (deckDealer) => {
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
      this._gameController?.do(actionInfo);
    });

    this._deckDealer?.addCards([
      this._cards[0],
      this._cards[1],
      this._cards[30],
      this._cards[31],
      this._cards[32],
    ]);
  }

  private _createCards() {
    CARD_SUITS.forEach((suit) => {
      for (let i = 1; i < suit.values + 1; i++) {
        const card = new Card(
          { suit: suit.id, value: i },
          'back_red.png',
          `${suit.id}_${i}.png`
        );
        card.scale.set(this._config.cardScale);
        this._cards.push(card);
      }
    });
  }

  private _getDeckBase(variant: number = 0) {
    if (variant === 1) {
      const base = new Container();
      const base1 = Sprite.from(this._config.baseTexture);
      base1.height = this._cards[0].height;
      base1.width = this._cards[0].width;
      base1.anchor.set(0.5);
      base.addChild(base1);

      const baseLogo = Sprite.from(this._config.baseLogoTexture);
      baseLogo.scale.set(this._config.cardScale * 0.75);
      baseLogo.anchor.set(0.5);
      base.addChild(baseLogo);

      return base;
    }

    const base = Sprite.from(this._config.baseTexture);
    base.height = this._cards[0].height;
    base.width = this._cards[0].width;
    base.anchor.set(0.5);
    return base;
  }

  private _createDecks() {
    const gap = this._config.decksGap;
    const cardWidth = this._cards[0].width;
    const cardHeight = this._cards[0].height;

    // Deck Dealer
    this._deckDealer = new DeckDealer({
      dealAnimation: {
        duration: 0.15,
      },
      deck: {
        amount: 2,
        padding: gap,
        gap: gap,
        width: cardWidth,
        height: cardHeight,
      },
      bases: [this._getDeckBase(), this._getDeckBase()],
    });
    this.addChild(this._deckDealer);

    // Foundations Dealer
    this._foundationsDealer = new FoundationsDealer({
      deck: {
        amount: 4,
        padding: gap,
        gap: gap,
        width: cardWidth,
        height: cardHeight,
      },
      bases: [
        this._getDeckBase(1),
        this._getDeckBase(1),
        this._getDeckBase(1),
        this._getDeckBase(1),
      ],
    });
    this._foundationsDealer.x = 3 * cardWidth + 3 * gap;
    this.addChild(this._foundationsDealer);

    // Tableu Dealer
    this._tableuDealer = new TableuDealer({
      deck: {
        amount: 7,
        padding: gap,
        gap: gap,
        width: cardWidth,
        height: cardHeight,
        offset: this._config.decksOffset.tableu,
      },
      bases: [],
    });
    this._tableuDealer.y = gap + cardHeight;
    this.addChild(this._tableuDealer);
  }

  public updateSize(app: Application) {
    if (!this._isInitialized) return;

    // Scale the whole container to FIT into the config frame
    const scaleH = app.canvas.height / this._config.frame.height;
    const scaleW = app.canvas.width / this._config.frame.width;
    this.scale.set(Math.min(scaleH, scaleW));
  }
}
