import { Application, Container, Sprite, Texture, Text } from 'pixi.js';
import CARD_SUITS from '../constants/cards';
import { DeckDealer } from '../components/deckDealer';
import { FoundationsDealer } from '../components/foundationsDealer';
import { TableuDealer } from '../components/tableuDealer';
import { CardsDealer } from '../systems/cardsDealer';
import { GameController } from '../systems/gameController';

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  private _config = {
    backTexture: 'back_red.png',
    baseTexture: 'card_base-2.png',
    redoTexture: 'redo.png',
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
  public cardsDealer: CardsDealer | null = null;
  public deckDealer: DeckDealer | null = null;
  public foundationsDealer: FoundationsDealer | null = null;
  public tableuDealer: TableuDealer | null = null;

  constructor() {
    super();
  }

  public async init(gameController: GameController) {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this._gameController = gameController;

    this._config.cardScale =
      this._config.card.height / Texture.from(this._config.backTexture).height;

    // CARDS
    this.cardsDealer = new CardsDealer();
    this.cardsDealer.init(CARD_SUITS, (card) => {
      card.scale.set(this._config.cardScale);
    });

    // DECK DEALERS
    this._createDecks();
  }

  private _getDeckBase(variant: number = 0) {
    const aCard = this.cardsDealer?.getCardByIndex(0);
    const cardHeight = aCard?.height || 100;
    const cardWidth = aCard?.width || 100;

    if (variant === 1) {
      const base = new Container();
      const base1 = Sprite.from(this._config.baseTexture);
      base1.height = cardHeight;
      base1.width = cardWidth;
      base1.anchor.set(0.5);
      base.addChild(base1);

      const baseLogo = Sprite.from(this._config.baseLogoTexture);
      baseLogo.scale.set(this._config.cardScale * 0.75);
      baseLogo.anchor.set(0.5);
      base.addChild(baseLogo);

      return base;
    }

    if (variant === 2) {
      const base = new Container();
      const base1 = Sprite.from(this._config.baseTexture);
      base1.height = cardHeight;
      base1.width = cardWidth;
      base1.anchor.set(0.5);
      base.addChild(base1);

      const baseRedo = Sprite.from(this._config.redoTexture);
      baseRedo.scale.set(this._config.cardScale);
      baseRedo.anchor.set(0.5, 0.75);
      base.addChild(baseRedo);

      const text = new Text({
        text: 'REDEAL',
        style: {
          fontFamily: 'Arial',
          fontSize: 32,
        },
      });
      text.alpha = 0.5;
      text.anchor.set(0.5);
      text.y = 50;
      base.addChild(text);

      return base;
    }

    const base = Sprite.from(this._config.baseTexture);
    base.height = cardHeight;
    base.width = cardWidth;
    base.anchor.set(0.5);
    return base;
  }

  private _createDecks() {
    const gap = this._config.decksGap;
    const aCard = this.cardsDealer?.getCardByIndex(0);
    const cardHeight = aCard?.height || 100;
    const cardWidth = aCard?.width || 100;

    // Deck Dealer
    this.deckDealer = new DeckDealer({
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
      bases: [this._getDeckBase(2), this._getDeckBase()],
    });
    this.addChild(this.deckDealer);

    // Foundations Dealer
    this.foundationsDealer = new FoundationsDealer({
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
    this.foundationsDealer.x = 3 * cardWidth + 3 * gap;
    this.addChild(this.foundationsDealer);

    // Tableu Dealer
    this.tableuDealer = new TableuDealer({
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
    this.tableuDealer.y = gap + cardHeight;
    this.addChild(this.tableuDealer);
  }

  public shuffle() {
    if (!this._isInitialized) return;

    this.cardsDealer?.shuffle();
    this.deckDealer?.reset();
    this.foundationsDealer?.reset();
    this.tableuDealer?.reset();

    // Deal the cards
    this.dealCards();
  }

  public dealCards() {
    if (this.cardsDealer) {
      for (let i = 0; i < this._config.tableuCols; i++) {
        const cards = this.cardsDealer?.getHandCards(i + 1);
        this.tableuDealer?.initDeck(cards, i);
      }
      const stock = this.cardsDealer?.getStock();

      this.deckDealer?.addCards(stock);
    }
  }

  public updateSize(app: Application) {
    if (!this._isInitialized) return;

    // Scale the whole container to FIT into the config frame
    const scaleH = app.canvas.height / this._config.frame.height;
    const scaleW = app.canvas.width / this._config.frame.width;
    this.scale.set(Math.min(scaleH, scaleW));
  }
}
