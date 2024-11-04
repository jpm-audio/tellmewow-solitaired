import { DeckDealer } from '../components/deckDealer';
import { FoundationsDealer } from '../components/foundationsDealer';
import { TableuDealer } from '../components/tableuDealer';
import SceneBuilder, {
  SceneBuilderCreateInfo,
  SceneBuilderDropTestResult,
} from './sceneBuilder';
import { DeckBase } from '../components/deckBase';
import CARD_SUITS, { Actions, Decks } from '../constants/cards';
import { Dealer, IntersectionResult } from '../components/dealer';
import { SceneState, StateRegister } from '../systems/stateHandler';
import { Point, PointData } from 'pixi.js';
import { ActionRegister, CardLocation } from '../systems/actionsHandler';
import Card from '../components/card';
import Deck from '../components/deck';
import { Game } from '../systems/game';
import { GameEvents } from '../constants/gameEvents';
import { GameAction } from './gameActions';

/**
 * Custom actions for "Turn 1 Solitaire Game"
 */
const GAME_ACTIONS_TURN_1: GameAction[] = [
  {
    id: 'deal',
    callback: async (
      actionRegister: ActionRegister,
      sceneBuilder: SceneBuilder
    ) => {
      const scene = sceneBuilder as SceneBuilderTurn1;
      if (actionRegister.undo) {
        await scene.deckDealer.undeal();
      } else {
        await scene.deckDealer.deal();
      }
    },
    moveAdd: 1,
    passthrusAdd: 0,
  },
  {
    id: 'redeal',
    callback: async (
      actionRegister: ActionRegister,
      sceneBuilder: SceneBuilder
    ) => {
      const scene = sceneBuilder as SceneBuilderTurn1;

      if (actionRegister.undo) {
        await scene.deckDealer.unredeal();
      } else {
        await scene.deckDealer.redeal();
      }
    },
    moveAdd: 1,
    passthrusAdd: 1,
  },
];

/**
 * Scene Builder for "Turn 1 Solitaire Game"
 */
export class SceneBuilderTurn1 extends SceneBuilder {
  private _config = {
    backTexture: 'back_red.png',
    redoTexture: 'redo.png',
    baseLogoTexture: 'logo-black.png',
    card: { width: 254, height: 576 },
    decksGap: 6,
    decksOffset: { tableu: { x: 0, y: 102 } },
    fundations: 4,
    tableuCols: 7,
  };

  public deckDealer!: DeckDealer;
  public foundationsDealer!: FoundationsDealer;
  public tableuDealer!: TableuDealer;

  public get gameActions() {
    return GAME_ACTIONS_TURN_1;
  }

  public get stock() {
    return this.deckDealer.stock.numCards;
  }

  private _getDeckBase(variant: number = 0) {
    const card = this.cardsDealer.getCardByIndex(0) as Card;
    return DeckBase.base(variant, card.width, card.height);
  }

  public create({ scene, frame }: SceneBuilderCreateInfo) {
    this._createCardsDealer(CARD_SUITS);
    const card = this.cardsDealer.getCardByIndex(0) as Card;
    const gap = this._config.decksGap;
    const cardHeight = card.height;
    const cardWidth = card.width;

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
    const maxHeight = frame.height - cardHeight - 4 * gap;
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

    scene.addChild(this.tableuDealer);
    scene.addChild(this.foundationsDealer);
    scene.addChild(this.deckDealer);

    // EVENTS EXECUTION
    this.deckDealer.on('stock.pointerdown', (deckDealer) => {
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
      Game.bus.emit(GameEvents.ACTION, actionInfo);
    });

    Game.bus.on(GameEvents.DROP, (cardInfo, location: CardLocation) => {
      this.onPileChanged(location);
    });
  }

  public getInfo(): SceneState {
    return {
      dealer: this.deckDealer.info,
      foundations: this.foundationsDealer.info,
      tableu: this.tableuDealer.info,
    };
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

  public initCards() {
    this.cardsDealer.shuffle();

    for (let i = 0; i < this._config.tableuCols; i++) {
      const cards = this.cardsDealer.getHandCards(i + 1);
      this.tableuDealer.initDeck(cards, i);
    }
    this.deckDealer.addCards(this.cardsDealer.getStock());
  }

  public setCards(state: StateRegister) {
    // Set Stock/Waste decks
    state.cards.dealer.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SceneBuilderTurn1::setCards - card retrived is null'
          );
        this.deckDealer.addCards([card], deckIndex);
      });
    });

    // Set Foundations decks
    state.cards.foundations.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SceneBuilderTurn1::setCards - card retrived is null'
          );
        card.set(cardInfo.info.way);
        this.foundationsDealer.addCards([card], deckIndex);
      });
    });

    //Set Tableu decks
    state.cards.tableu.forEach((deckInfo, deckIndex) => {
      deckInfo.forEach((cardInfo) => {
        const card = this.cardsDealer.getCardByInfo(cardInfo.info);
        if (!card)
          throw new Error(
            'SceneBuilderTurn1::setCards - card retrived is null'
          );
        card.set(cardInfo.info.way);
        this.tableuDealer.addCards([card], deckIndex);
      });
    });
  }

  public getPileFromLocation(location: CardLocation): Deck | null {
    return this.getDealerByName(location.deck).getPile(location.pile);
  }

  public takeCards(cardLocation: CardLocation): Card[] {
    // Check if the card is draggable
    const deckName = cardLocation?.deck;
    if (!deckName || !cardLocation) {
      return [];
    }

    // Find the cards & remove from the origin pile
    const dealer = this.getDealerByName(deckName);
    const topCard = dealer
      .getPile(cardLocation.pile)
      .seeCard(cardLocation.position) as Card;
    const coords = this.cardsDealer.getCardGlobalCoords(topCard) as PointData;
    const pileOffset = dealer.getPile(cardLocation.pile).currentOffset;
    const cards = dealer.getDragCards(cardLocation.pile, cardLocation.position);

    if (!cards.length) return [];

    // Set the card with global coords
    cards.forEach((card, index) => {
      card.y = coords.y + pileOffset * index;
      card.x = coords.x;
    });

    return cards;
  }

  public onPileChanged(location: CardLocation) {
    if (location && location.deck === 'tableu') {
      const pile = this.getPileFromLocation(location) as Deck;
      pile.adaptHeight(true);
    }
  }

  public onUndoStart(
    fromLocation: CardLocation,
    toLocation: CardLocation,
    pendingTurn: boolean = false
  ): boolean {
    // Turn back the top card on destination pile (Tableu only)
    if (pendingTurn && toLocation.deck === 'tableu') {
      const topCard = (this.getPileFromLocation(toLocation) as Deck).topCard();
      // Wee need to know whether the need Flip or not
      topCard?.animateFlip();
      return true;
    }

    return false;
  }

  public dropTest(cards: Card[]): SceneBuilderDropTestResult | null {
    const droppedCard = cards[0];

    // Check intersections of dropped cards with dealers
    const intersectedTableu = this.tableuDealer.checkIntersections(
      droppedCard
    ) as IntersectionResult[];
    const intersectedFoundations = this.foundationsDealer?.checkIntersections(
      droppedCard
    ) as IntersectionResult[];
    const intersectedCards = [...intersectedTableu, ...intersectedFoundations];

    // Order the intersected cards by intersection area
    intersectedCards?.sort((a, b) => b.intersection - a.intersection);

    // Cancel if no intersected cards
    if (!intersectedCards.length) {
      return null;
    }

    // Move the card to the top card of the intersected pile
    const destinationCard = intersectedCards[0].card;
    let hasHostCard2Turn = false;

    // Shows the next Card into the origin pile
    if (droppedCard.location?.deck === 'tableu') {
      // Check whether the host card actually need turning up
      const originPile = cards[0].location?.pile || 0;
      hasHostCard2Turn = this.tableuDealer.isTopCardUp(originPile) as boolean;

      if (hasHostCard2Turn) {
        this.tableuDealer.turnTopPileCard(droppedCard.location?.pile || 0);
      }
    }

    // Add Card into destination Dealer
    // - Tableu
    this.dropCards(cards, destinationCard.location as CardLocation);

    return {
      destinationLocation: destinationCard.location as CardLocation,
      hasHostCard2Turn,
    };
  }

  public dropCards(cards: Card[], location: CardLocation): boolean {
    const deckName = location?.deck;

    if (deckName === 'tableu') {
      const cardsOffsetY =
        cards.length > 1 ? new Point(0, cards[1].y - cards[0].y) : undefined;
      this.tableuDealer.addCards(cards, location.pile || 0, cardsOffsetY);
      this.tableuDealer.getPile(location.pile).adaptHeight(true);
      return true;
    }
    if (deckName === 'foundation') {
      const deck = this.foundationsDealer.getPile(location.pile);
      this.foundationsDealer.addCards(cards, location.pile || 0);
      Game.bus.emit(GameEvents.SUCCESS, { level: deck.numCards });
      this.winTest();
      return true;
    }
    if (deckName === 'waste') {
      this.deckDealer.addCards(cards, 1);
      return true;
    }

    return false;
  }

  public winTest(): boolean {
    if (this.foundationsDealer.checkWin()) {
      Game.bus.emit(GameEvents.WIN);
      return true;
    }
    return false;
  }

  public reset() {
    this.deckDealer.reset();
    this.foundationsDealer.reset();
    this.tableuDealer.reset();
  }
}
