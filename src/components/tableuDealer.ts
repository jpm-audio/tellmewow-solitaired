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

  public addCards(cards: Card[], deckIndex: number) {
    cards.forEach((card) => {
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
}
