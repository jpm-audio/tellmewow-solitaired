import { Container, Point, PointData } from 'pixi.js';
import Card from './card';
import Deck from './deck';
import { Decks } from '../constants/cards';
import { CardBase } from './cardBase';
import { CardState } from '../systems/stateHandler';

export interface DealerSettings {
  deck: {
    amount: number;
    padding: number;
    gap: number;
    width: number;
    height: number;
    offset?: PointData;
  };
  bases: Array<CardBase>;
}

export const DEFAULT_DEALER_SETTINGS = {
  deck: {
    amount: 1,
    padding: 0,
    gap: 0,
    width: 100,
    height: 100,
    offset: new Point(),
  },
  bases: [],
};

export type IntersectionResult = { card: CardBase; intersection: number };

export class Dealer extends Container {
  protected _settings: DealerSettings = DEFAULT_DEALER_SETTINGS;
  protected _name: Decks = 'stock';
  protected _basesLayer: Container;
  protected _decksLayer: Container;

  constructor(settings: DealerSettings) {
    super();

    this._settings = settings;
    this._basesLayer = new Container();
    this._decksLayer = new Container();
    this.addChild(this._basesLayer);
    this.addChild(this._decksLayer);
  }

  public get info(): CardState[][] {
    const dealerInfo: CardState[][] = [];

    this._decksLayer.children.forEach((deck, deckIndex) => {
      const pile = deck as Deck;
      const cards = pile.seeCards();
      const deckInfo: CardState[] = [];
      cards.forEach((card, cardIndex) => {
        deckInfo.push({
          info: card.info,
          location: {
            deck: this._name,
            pile: cardIndex,
            position: deckIndex,
          },
        });
      });
      dealerInfo.push(deckInfo);
    });

    return dealerInfo;
  }

  public addCards(cards: Card[], deckIndex: number, offset?: Point) {
    cards.forEach((card) => {
      const deck = this.getPile(deckIndex);

      card.location = {
        deck: this._name,
        pile: deckIndex,
        position: deck.numCards,
      };

      deck.addCard(card, undefined, offset);
    });
  }

  public getCard(deckIndex: number, positionIndex: number = 0): Card | null {
    const deck = this.getPile(deckIndex);

    if (deck && deck.numCards > positionIndex) {
      return deck.getCard(positionIndex);
    }
    return null;
  }

  public seeCard(deckIndex: number, positionIndex: number = 0): Card | null {
    return this.getPile(deckIndex)?.seeCard(positionIndex);
  }

  public getDragCards(deckIndex: number, positionIndex: number = 0): Card[] {
    const cards: Card[] = [];
    const deck = this.getPile(deckIndex);

    if (deck && deck.numCards > positionIndex) {
      const card = deck.getCard();
      if (card !== null) {
        cards.push(card);
      }
    }
    return cards;
  }

  public getPile(deckIndex: number): Deck {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;
    return deck;
  }

  public getBase(deckIndex: number): CardBase {
    return this._basesLayer.getChildAt(deckIndex);
  }

  public checkIntersections(card: Card): IntersectionResult[] {
    const intersectedCards: IntersectionResult[] = [];

    // Check top card of each pile
    for (
      let deckIndex = 0;
      deckIndex < this._decksLayer.children.length;
      deckIndex++
    ) {
      // Skip the card pile
      if (
        card.location?.deck === this._name &&
        deckIndex === card.location?.pile
      )
        continue;

      // Get the top card of the pile
      const deck = this.getPile(deckIndex) as Deck;
      const cardBase: CardBase | null =
        deck.topCard() || this.getBase(deckIndex);

      if (!cardBase) continue;

      // Check if the card intersects with the top card
      const intersectionArea = card.testIntersection(cardBase);
      if (intersectionArea > 0) {
        intersectedCards.push({
          card: cardBase,
          intersection: intersectionArea,
        });
      }
    }

    return intersectedCards;
  }

  public reset() {
    this._decksLayer.children.forEach((deck) => {
      (deck as Deck).reset();
    });
  }
}
