import {
  Application,
  Container,
  FederatedPointerEvent,
  Point,
  PointData,
  Sprite,
} from 'pixi.js';
import CARD_SUITS, { Decks } from '../constants/cards';
import { DeckDealer } from '../components/deckDealer';
import { FoundationsDealer } from '../components/foundationsDealer';
import { TableuDealer } from '../components/tableuDealer';
import { CardsDealer } from '../systems/cardsDealer';
import Card from '../components/card';
import { Dealer, IntersectionResult } from '../components/dealer';
import { DeckBase } from '../components/deckBase';
import { StateRegister } from '../systems/stateHandler';
import { CardLocation } from '../systems/actionsHandler';
import gsap from 'gsap';
import { sound } from '@pixi/sound';

interface DragggingCards {
  cards: Card[];
  cardOrigin: Point;
  clientOrigin: Point;
  cardsOffset: Point;
}

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  protected _draggedCards: DragggingCards | null = null;
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
  public cardsDealer: CardsDealer | null = null;
  public deckDealer: DeckDealer | null = null;
  public foundationsDealer: FoundationsDealer | null = null;
  public tableuDealer: TableuDealer | null = null;

  public get isDragging() {
    return this._draggedCards !== null;
  }

  constructor() {
    super();
  }

  public async init() {
    if (this._isInitialized) return;
    this._isInitialized = true;

    this._draggingBackground = Sprite.from(this._config.baseTexture);
    this._draggingBackground.alpha = 0;
    this._draggingBackground.width = this._config.frame.width;
    this._draggingBackground.height = this._config.frame.height;
    this.addChild(this._draggingBackground);

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
    return DeckBase.base(variant, aCard?.width || 100, aCard?.height || 100);
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
    const maxHeight = this._config.frame.height - cardHeight - 4 * gap;
    this.tableuDealer = new TableuDealer(
      {
        deck: {
          amount: 7,
          padding: gap,
          gap: gap,
          width: cardWidth,
          height: cardHeight,
          offset: this._config.decksOffset.tableu,
        },
        bases: [
          this._getDeckBase(),
          this._getDeckBase(),
          this._getDeckBase(),
          this._getDeckBase(),
          this._getDeckBase(),
          this._getDeckBase(),
          this._getDeckBase(),
        ],
      },
      maxHeight
    );
    this.tableuDealer.y = gap + cardHeight;

    this.addChild(this.tableuDealer);
    this.addChild(this.foundationsDealer);
    this.addChild(this.deckDealer);
  }

  public getDealerByName(name: Decks): Dealer {
    switch (name) {
      case 'foundation':
        return this.foundationsDealer as Dealer;
      case 'tableu':
        return this.tableuDealer as Dealer;
      default:
        return this.deckDealer as Dealer;
    }
  }

  public onDragStart(event: FederatedPointerEvent) {
    if (event.target.constructor.name !== 'Card') return;

    event.stopPropagation();

    this._draggedCards = {
      cards: [],
      cardOrigin: new Point(),
      clientOrigin: new Point(),
      cardsOffset: new Point(),
    };

    // Store Client Origin
    this._draggedCards.clientOrigin.copyFrom(event.getLocalPosition(this));

    // Store Card Origin
    const card = event.target as Card;
    const coords = this.cardsDealer?.getCardGlobalCoords(card) as PointData;
    this._draggedCards.cardOrigin.copyFrom(coords);

    // Check if the card is draggable
    if (!coords) return;
    const cardLocation = card.location;
    const deckName = cardLocation?.deck;
    if (!deckName || !cardLocation) {
      this.onDragCancel();
      return;
    }

    // Get the dragged cards
    const dealer = this.getDealerByName(deckName);
    const pileOffset = dealer.getPile(cardLocation.pile).currentOffset;
    this._draggedCards.cards = dealer.getDragCards(
      cardLocation.pile,
      cardLocation.position
    );
    this._draggedCards.cardsOffset.y = pileOffset;

    this._draggedCards.cards.forEach((card, index) => {
      card.y = coords.y + pileOffset * index;
      card.x = coords.x;
      this.addChild(card);
    });

    sound.play('card-touch');

    this.emit('onDragStart', this._draggedCards);
  }

  public onDragMove(event: FederatedPointerEvent) {
    if (!this._draggedCards) return;

    const newCoords = new Point(
      this._draggedCards.cardOrigin.x +
        (event.getLocalPosition(this).x - this._draggedCards.clientOrigin.x),
      this._draggedCards.cardOrigin.y +
        (event.getLocalPosition(this).y - this._draggedCards.clientOrigin.y)
    );

    this._draggedCards.cards.forEach((card, index) => {
      if (this._draggedCards === null) return;
      card.y = newCoords.y + this._draggedCards.cardsOffset.y * index;
      card.x = newCoords.x;
      this.addChild(card);
    });
  }

  public onDragEnd(event?: FederatedPointerEvent) {
    if (!this._draggedCards) return;

    if (event) {
      this.onDragMove(event);
    }

    const intersectedTableu = this.tableuDealer?.checkIntersections(
      this._draggedCards.cards[0]
    ) as IntersectionResult[];
    const intersectedFoundations = this.foundationsDealer?.checkIntersections(
      this._draggedCards.cards[0]
    ) as IntersectionResult[];
    const intersectedCards = [...intersectedTableu, ...intersectedFoundations];

    // Order the intersected cards by intersection area
    intersectedCards?.sort((a, b) => b.intersection - a.intersection);

    // Cancel if no intersected cards
    if (!intersectedCards.length) {
      this.onDragCancel();
      return;
    }

    // Move the card to the top card of the intersected pile
    const intCard = intersectedCards[0].card;

    // Shows the next Card into the origin pile
    if (this._draggedCards.cards[0].location?.deck === 'tableu') {
      this.tableuDealer?.turnTopPileCard(
        this._draggedCards.cards[0].location?.pile || 0
      );
    }

    const originCardLocation = {
      deck: this._draggedCards.cards[0].location?.deck,
      pile: this._draggedCards.cards[0].location?.pile,
      position: this._draggedCards.cards[0].location?.position,
    };

    // Add Card into destination Dealer
    if (intCard.location?.deck === 'tableu') {
      this.tableuDealer?.addCards(
        this._draggedCards.cards,
        intCard.location?.pile || 0,
        this._draggedCards.cards.length > 1
          ? this._draggedCards.cardsOffset
          : undefined
      );
    } else {
      this.foundationsDealer?.addCards(
        this._draggedCards.cards,
        intCard.location?.pile || 0
      );

      if (this._draggedCards.cards[0].info.value === 1) {
        sound.play('card-great');
      } else {
        sound.play('card-nice');
      }
    }

    this.emit(
      'onDragEnd',
      this._draggedCards.cards[0].info,
      originCardLocation,
      intCard.location
    );

    // Drag End
    this._draggedCards = null;

    sound.play('card-drop');
  }

  public onDragCancel() {
    if (!this._draggedCards) return;

    const cardLocation = this._draggedCards.cards[0].location;
    const deckName = cardLocation?.deck;

    if (deckName === 'tableu') {
      this.tableuDealer?.addCards(
        this._draggedCards.cards,
        cardLocation?.pile || 0
      );
    }
    if (deckName === 'foundation') {
      this.foundationsDealer?.addCards(
        this._draggedCards.cards,
        cardLocation?.pile || 0
      );
    }
    if (deckName === 'waste') {
      this.deckDealer?.addCards(this._draggedCards.cards, 1);
    }

    this._draggedCards = null;

    this.emit('onDragCancel');
    sound.play('card-drop');
  }

  public shuffle() {
    if (!this._isInitialized) return;

    this.reset();
    this.cardsDealer?.shuffle();

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

  public setCardsState({ cards }: StateRegister) {
    if (!this.cardsDealer)
      throw new Error('SolitaireScene::setCardsState - cardsDealer is null');

    // Set Stock/Waste decks
    cards.dealer.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        if (!this.cardsDealer)
          throw new Error(
            'SolitaireScene::setCardsState - cardsDealer is null'
          );
        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SolitaireScene::setCardsState - card retrived is null'
          );
        this.deckDealer?.addCards([card], deckIndex);
      });
    });

    // Set Foundations decks
    cards.foundations.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        if (!this.cardsDealer)
          throw new Error(
            'SolitaireScene::setCardsState - cardsDealer is null'
          );

        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SolitaireScene::setCardsState - card retrived is null'
          );
        card.set(cardInfo.info.way);
        this.foundationsDealer?.addCards([card], deckIndex);
      });
    });

    //Set Tableu decks
    cards.tableu.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        if (!this.cardsDealer)
          throw new Error(
            'SolitaireScene::setCardsState - cardsDealer is null'
          );
        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SolitaireScene::setCardsState - card retrived is null'
          );
        card.set(cardInfo.info.way);
        this.tableuDealer?.addCards([card], deckIndex);
      });
    });
  }

  public async moveCards(from: CardLocation, to: CardLocation) {
    const fromDealer = this.getDealerByName(from.deck);
    const toDealer = this.getDealerByName(to.deck);
    const actionCard = fromDealer.seeCard(from.pile, from.position + 1);
    if (!actionCard) return;

    // Get initial coords of the card
    const coords = this.cardsDealer?.getCardGlobalCoords(
      actionCard
    ) as PointData;
    const cardsOffsetY = fromDealer.getPile(from.pile).currentOffset;

    // Now, actually GET all involved cards
    const cards = fromDealer?.getDragCards(from.pile, from.position + 1);

    // Anything?
    if (!cards || cards.length === 0) return;

    // Set cards in scene space
    cards.forEach((card, index) => {
      card.y = coords.y + cardsOffsetY * index;
      card.x = coords.x;
      this.addChild(card);
    });

    // Destination Coordinates!
    const destinationPile = toDealer.getPile(to.pile);
    const destCoords = {
      x: destinationPile.x + toDealer.x,
      y:
        destinationPile.y +
        toDealer.y +
        destinationPile.currentOffset * destinationPile.numCards,
    };

    // Turn back the top card on destination pile (Tableu only)
    if (to.deck === 'tableu') {
      const pile = toDealer.getPile(to.pile);
      pile.topCard()?.animateFlip();
    }

    // Aaaand move the card!
    const tween = gsap.to(cards[0], {
      x: destCoords.x,
      y: destCoords.y,
      duration: 0.25,
      ease: 'power1.out',
      onUpdate: () => {
        cards.forEach((card, index) => {
          if (index === 0) return;
          card.y = cards[0].y + cardsOffsetY * index;
          card.x = cards[0].x;
          this.addChild(card);
        });
      },
    });
    await tween.play();

    // Add Card into destination Dealer
    if (to.deck === 'tableu') {
      toDealer.addCards(
        cards,
        to.pile,
        cards.length > 1 ? new Point(0, cardsOffsetY) : undefined
      );

      toDealer.getPile(to.pile).adaptHeight();
    } else {
      toDealer.addCards(cards, to.pile || 0);
    }
  }

  public updateSize(app: Application) {
    if (!this._isInitialized) return;

    // Scale the whole container to FIT into the config frame
    const scaleH = app.canvas.height / this._config.frame.height;
    const scaleW = app.canvas.width / this._config.frame.width;
    this.scale.set(Math.min(scaleH, scaleW));
  }

  public reset() {
    this.deckDealer?.reset();
    this.foundationsDealer?.reset();
    this.tableuDealer?.reset();
  }

  public enable() {
    this.eventMode = 'static';
  }

  public disable() {
    this.eventMode = 'none';
  }
}
