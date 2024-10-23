import { Container, PointData, Sprite } from 'pixi.js';
import Card from './card';
import Deck from './deck';
import { Decks } from '../constants/cards';

export interface DealerSettings {
  deck: {
    amount: number;
    padding: number;
    gap: number;
    width: number;
    height: number;
    offset?: PointData;
  };
  bases: Array<Sprite | Container>;
}

export type IntersectionResult = { card: Card; intersection: number };

export class Dealer extends Container {
  protected _name: Decks = 'stock';
  protected _basesLayer: Container;
  protected _decksLayer: Container;

  constructor() {
    super();
    this._basesLayer = new Container();
    this._decksLayer = new Container();
    this.addChild(this._basesLayer);
    this.addChild(this._decksLayer);
  }

  public addCards(cards: Card[], deckIndex: number) {
    cards.forEach((card, index) => {
      card.location = {
        deck: this._name,
        pile: deckIndex,
        position: index,
      };
      const deck = this._decksLayer.getChildAt(deckIndex) as Deck;
      deck.addCard(card);
    });
  }

  public getCard(deckIndex: number, positionIndex: number = 0): Card | null {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;

    if (deck && deck.numCards > positionIndex) {
      return deck.getCard(positionIndex);
    }
    return null;
  }

  public getDragCards(
    deckIndex: number,
    positionIndex: number = 0
  ): Card[] | [] {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;

    if (deck && deck.numCards > positionIndex) {
      const card = deck.getCard(positionIndex);
      return card ? [card] : [];
    }
    return [];
  }

  public getPile(deckIndex: number): Deck {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;
    return deck;
  }

  public checkIntersections(card: Card): IntersectionResult[] {
    const intersectedCards: IntersectionResult[] = [];

    // Check top card of each pile
    for (let index = 0; index < this._decksLayer.children.length; index++) {
      // Skip the card pile
      if (card.location?.deck === this._name && index === card.location?.pile)
        continue;

      // Get the top card of the pile
      const deck = this._decksLayer.children[index] as Deck;
      const topCard = deck.topCard();
      if (!topCard) continue;

      // Check if the card intersects with the top card
      const intersectionArea = card.testIntersection(topCard);
      if (intersectionArea > 0) {
        intersectedCards.push({
          card: topCard,
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
