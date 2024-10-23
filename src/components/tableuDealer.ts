import { Container } from 'pixi.js';
import { Dealer, DealerSettings } from './dealer';
import Deck from './deck';
import Card from './card';

export class TableuDealer extends Dealer {
  protected _decksLayer: Container;

  constructor(settings: DealerSettings) {
    super();

    // Layers
    this._decksLayer = new Container();
    this.addChild(this._decksLayer);

    const offset = {
      x: settings.deck.padding + settings.deck.width / 2,
      y: settings.deck.padding + settings.deck.height / 2,
    };

    for (let i = 0; i < settings.deck.amount; i++) {
      const deck = new Deck(settings.deck.offset);
      deck.x = offset.x + i * (settings.deck.gap + settings.deck.width);
      deck.y = offset.y;
      this._decksLayer.addChild(deck);
    }
  }

  public initDeck(cards: Card[], deckIndex: number) {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;
    cards.forEach((card, index) => {
      // Write card location
      card.location = {
        deck: 'tableu',
        pile: deckIndex,
        position: index,
      };
      // Add Card into deck
      deck.addCard(card, index !== cards.length - 1 ? 'back' : 'front');
    });
  }

  public addCards(cards: Card[], deckIndex: number) {
    const deck = this._decksLayer.getChildAt(deckIndex) as Deck;
    cards.forEach((card) => {
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

  public reset() {
    this._decksLayer.children.forEach((deck) => {
      (deck as Deck).reset();
    });
  }
}
