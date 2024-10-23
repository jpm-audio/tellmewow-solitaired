import {
  Application,
  Container,
  FederatedPointerEvent,
  Point,
  PointData,
  Sprite,
  Text,
} from 'pixi.js';
import CARD_SUITS from '../constants/cards';
import { DeckDealer } from '../components/deckDealer';
import { FoundationsDealer } from '../components/foundationsDealer';
import { TableuDealer } from '../components/tableuDealer';
import { CardsDealer } from '../systems/cardsDealer';
import { GameController } from '../systems/gameController';
import Card from '../components/card';
import { Dealer, IntersectionResult } from '../components/dealer';

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  protected _isDragging: boolean = false;
  protected _dragClientOrigin: Point = new Point();
  protected _dragCardOrigin: Point = new Point();
  protected _draggedCard: Card | null = null;
  protected _draggingBackground: Sprite | null = null;
  private _config = {
    backTexture: 'back_red.png',
    baseTexture: 'card_base-2.png',
    redoTexture: 'redo.png',
    baseLogoTexture: 'logo-black.png',
    frame: { width: 2904, height: 1805 },
    card: { width: 254, height: 576 },
    decksGap: 6,
    decksOffset: { tableu: { x: 0, y: 102 } },
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

    this._draggingBackground = Sprite.from(this._config.baseTexture);
    this._draggingBackground.alpha = 0;
    this._draggingBackground.width = this._config.frame.width;
    this._draggingBackground.height = this._config.frame.height;
    this.addChild(this._draggingBackground);

    this._gameController = gameController;

    // CARDS
    this.cardsDealer = new CardsDealer();
    this.cardsDealer.init(CARD_SUITS);

    // DECK DEALERS
    this._createDecks();

    this.onpointerdown = this.onDragStart.bind(this);
    this.onpointermove = this.onDragMove.bind(this);
    this.onpointerup = this.onDragEnd.bind(this);
    this.onpointercancel = this.onDragCancel.bind(this);
    window.addEventListener('mouseout', this.onDragCancel.bind(this));
    this.eventMode = 'static';
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
      baseLogo.scale.set(0.75);
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
    this.addChild(this.foundationsDealer);
    this.addChild(this.deckDealer);
  }

  public enable() {
    this.eventMode = 'static';
  }

  public disable() {
    this.eventMode = 'none';
  }

  public onDragStart(event: FederatedPointerEvent) {
    if (event.target.constructor.name !== 'Card') return;

    event.stopPropagation();
    this._isDragging = true;
    this._dragClientOrigin.copyFrom(event.getLocalPosition(this));

    const card = event.target as Card;
    const coords = this.cardsDealer?.getCardGlobalCoords(card) as PointData;
    this._dragCardOrigin.copyFrom(coords);
    if (coords) {
      const cardLocation = card.location;
      const deckName = cardLocation?.deck;
      if (deckName === 'tableu') {
        this.tableuDealer?.getDragCards(
          cardLocation?.pile || 0,
          cardLocation?.position
        );
      }
      if (deckName === 'foundation') {
        this.foundationsDealer?.getDragCards(
          cardLocation?.pile || 0,
          cardLocation?.position
        );
      }
      if (deckName === 'waste') {
        this.deckDealer?.getDragCards(
          cardLocation?.pile || 0,
          cardLocation?.position
        );
      }

      //card.parent.removeChild(card);
      this.addChild(card);

      card.position.copyFrom(coords);
      this._draggedCard = card;
    }
  }

  public onDragMove(event: FederatedPointerEvent) {
    if (!this._isDragging || !this._draggedCard) return;

    this._draggedCard.x =
      this._dragCardOrigin.x +
      (event.getLocalPosition(this).x - this._dragClientOrigin.x);
    this._draggedCard.y =
      this._dragCardOrigin.y +
      (event.getLocalPosition(this).y - this._dragClientOrigin.y);
  }

  public onDragEnd(event?: FederatedPointerEvent) {
    if (!this._isDragging || !this._draggedCard) return;

    if (event) {
      this.onDragMove(event);
    }

    const intersectedTableu = this.tableuDealer?.checkIntersections(
      this._draggedCard
    ) as IntersectionResult[];
    const intersectedFoundations = this.foundationsDealer?.checkIntersections(
      this._draggedCard
    ) as IntersectionResult[];
    const intersectedCards = [...intersectedTableu, ...intersectedFoundations];

    // Order the intersected cards by intersection area
    intersectedCards?.sort((a, b) => b.intersection - a.intersection);

    // Move the card to the top card of the intersected pile
    if (intersectedCards[0]) {
      console.log(intersectedCards[0]);
      const intCard = intersectedCards[0].card;
      const dealer: Dealer | null =
        intCard.location?.deck === 'foundation'
          ? this.foundationsDealer
          : this.tableuDealer;

      dealer?.addCards([this._draggedCard], intCard.location?.pile || 0);
    } else {
      this.onDragCancel();
    }
  }

  public onDragCancel() {
    if (!this._isDragging || !this._draggedCard) return;

    const cardLocation = this._draggedCard.location;
    const deckName = cardLocation?.deck;
    if (deckName === 'tableu') {
      this.tableuDealer?.addCards([this._draggedCard], cardLocation?.pile || 0);
    }
    if (deckName === 'foundation') {
      this.foundationsDealer?.addCards(
        [this._draggedCard],
        cardLocation?.pile || 0
      );
    }
    if (deckName === 'waste') {
      this.deckDealer?.addCards([this._draggedCard], 1);
    }

    this._isDragging = false;
    this._draggedCard = null;
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
