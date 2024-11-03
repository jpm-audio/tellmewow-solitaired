import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  PointData,
  Rectangle,
} from 'pixi.js';
import Card from '../components/card';
import { Dealer } from '../components/dealer';
import { SceneState, StateRegister } from '../systems/stateHandler';
import { CardLocation } from '../systems/actionsHandler';
import gsap from 'gsap';
import { Game } from '../systems/game';
import { GameEvents } from '../constants/gameEvents';
import SceneBuilder from './sceneBuilder';

interface DragggingCards {
  cards: Card[];
  cardOrigins: PointData[];
  clientOrigin: PointData;
}

export class SolitaireScene extends Container {
  protected _isInitialized: boolean = false;
  protected _draggedCards: DragggingCards | null = null;
  protected _draggingBackground: Graphics | null = null;
  protected _sceneBuilder!: SceneBuilder;

  private _config = {
    frame: new Rectangle(0, 0, 2904, 1805),
  };

  public get isDragging() {
    return this._draggedCards !== null;
  }

  public get info(): SceneState {
    if (!this._sceneBuilder) return {};
    return this._sceneBuilder.getInfo();
  }

  public get stock() {
    return this._sceneBuilder.getStock();
  }

  constructor() {
    super();
  }

  public async init(sceneBuilder: SceneBuilder) {
    if (this._isInitialized) return;
    this._isInitialized = true;

    // Create Dragging Background
    this._draggingBackground = new Graphics();
    this._draggingBackground.fillStyle = { color: 0x000000, alpha: 1 };
    this._draggingBackground.rect(
      0,
      0,
      this._config.frame.width,
      this._config.frame.height
    );
    this.addChild(this._draggingBackground);

    // BUILD SCENE
    this._sceneBuilder = sceneBuilder;
    this._sceneBuilder.create({
      scene: this,
      frame: this._config.frame,
    });

    // SET EVENTS
    this.onpointerdown = this.onDragStart.bind(this);
    this.onpointermove = this.onDragMove.bind(this);
    this.onpointerup = this.onDragEnd.bind(this);
    this.onpointercancel = this.onDragCancel.bind(this);
    window.addEventListener('mouseout', this.onDragCancel.bind(this));
    this.eventMode = 'static';
  }

  public onDragStart(event: FederatedPointerEvent) {
    if (!('whatIAm' in event.target) || event.target.whatIAm !== 'Card') return;

    event.stopPropagation();

    // Try to take the card or cards from the origin pile
    const eventCard = event.target as Card;
    const cardLocation = eventCard.location as CardLocation;
    const cards = this._sceneBuilder.takeCards(cardLocation);

    // Check if we actually took any card
    if (!cards.length) {
      this.onDragCancel();
      return;
    }

    // Prepare the drag info
    this._draggedCards = {
      cards: [],
      cardOrigins: [],
      clientOrigin: new Point(),
    };

    // Prepare the cards at the origin position
    cards.forEach((card) => {
      this._draggedCards?.cardOrigins.push(card.position.clone());
      this.addChild(card);
    });

    // Notify Drag by events
    Game.bus.emit(GameEvents.TOUCH, this._draggedCards);
    this.emit('onDragStart', this._draggedCards);
  }

  public onDragMove(event: FederatedPointerEvent) {
    if (!this._draggedCards) return;

    // Calculate client displacement "delta"
    const deltaX =
      event.getLocalPosition(this).x - this._draggedCards.clientOrigin.x;
    const deltaY =
      event.getLocalPosition(this).y - this._draggedCards.clientOrigin.y;

    // Update Cards position
    this._draggedCards.cards.forEach((card, index) => {
      if (this._draggedCards === null) return;
      const cardOrigin = this._draggedCards.cardOrigins[index];
      card.x = cardOrigin.x + deltaX;
      card.y = cardOrigin.y + deltaY;
    });
  }

  public onDragEnd(event: FederatedPointerEvent) {
    if (!this._draggedCards) return;

    // Make the last move before the drop
    this.onDragMove(event);

    // Cache the dropped card location info before it is dropped on another location
    const droppedCard = this._draggedCards.cards[0];
    const originCardLocation = {
      deck: droppedCard.location?.deck,
      pile: droppedCard.location?.pile || 0,
      position: droppedCard.location?.position,
    };

    // Check if the card can be dropped
    const dropTestResult = this._sceneBuilder.dropTest(
      this._draggedCards.cards
    );

    // Cancel if drop test fails
    if (dropTestResult === null) {
      this.onDragCancel();
      return;
    }

    this.emit(
      'onDragEnd',
      droppedCard.info,
      originCardLocation,
      dropTestResult.destinationLocation,
      dropTestResult.hasHostCard2Turn
    );

    Game.bus.emit(
      GameEvents.DROP,
      droppedCard.info,
      originCardLocation,
      dropTestResult.destinationLocation,
      dropTestResult.hasHostCard2Turn
    );

    // Drag End
    this._draggedCards = null;
  }

  public onDragCancel() {
    if (!this._draggedCards) return;

    // Drop the cards on the origin pile
    this._sceneBuilder.dropCards(
      this._draggedCards.cards,
      this._draggedCards.cards[0].location as CardLocation
    );

    this._draggedCards = null;

    this.emit('onDragCancel');
    Game.bus.emit(GameEvents.DROP);
  }

  public newGame() {
    if (!this._isInitialized) return;
    // Reset the current game
    this.reset();
    // Deal the cards for a new game
    this._sceneBuilder.initCards();
  }

  public setGame(state: StateRegister) {
    this._sceneBuilder.setCards(state);
  }

  public async moveCards(
    from: CardLocation,
    to: CardLocation,
    hasHostCard2Turn: boolean
  ) {
    // Check if the destination pile exists
    const destinationPile = this._sceneBuilder.getPileFromLocation(to);

    if (!destinationPile)
      throw new Error(
        'SceneBuilder::moveCards - No pile found for the destination location given'
      );

    const destinationDealer = this._sceneBuilder.getDealerByName(
      to.deck
    ) as Dealer;

    // Take the cards from the origin pile
    const cards = this._sceneBuilder.takeCards(from);

    //TODO - Check wWhy it was getting from + 1?
    //const cards = fromDealer?.getDragCards(from.pile, from.position + 1);

    // Check if we actually took any card
    if (!cards.length) {
      this.onDragCancel();
      return;
    }

    // Set cards in scene space
    const cardsOffsetY = cards.length > 1 ? cards[1].y - cards[0].y : 0;
    cards.forEach((card) => {
      this.addChild(card);
    });

    // Destination Coordinates!
    const destCoords = {
      x: destinationPile.x + destinationDealer.x,
      y:
        destinationPile.y +
        destinationDealer.y +
        destinationPile.currentOffset * destinationPile.numCards,
    };

    // Preparations before the undo move animation
    this._sceneBuilder.onUndoStart(from, to, hasHostCard2Turn);

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

    // Now drop the cards on the destination pile
    this._sceneBuilder.dropCards(cards, to);

    // Preparations after the undo move animation
    this._sceneBuilder.onUndoEnd(from, to, hasHostCard2Turn);
  }

  public updateSize(app: Application) {
    if (!this._isInitialized) return;

    // Scale the whole container to FIT into the config frame
    const scaleH = app.canvas.height / this._config.frame.height;
    const scaleW = app.canvas.width / this._config.frame.width;
    this.scale.set(Math.min(scaleH, scaleW));

    this._sceneBuilder.updateSize();
  }

  public reset() {
    this._sceneBuilder.reset();
  }

  public enable() {
    this.eventMode = 'static';
  }

  public disable() {
    this.eventMode = 'none';
  }
}
