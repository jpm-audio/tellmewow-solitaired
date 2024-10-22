import { Container } from 'pixi.js';
import { Dealer, DealerSettings } from './dealer';
import Deck from './deck';
import Card from './card';

export class FoundationsDealer extends Dealer {
  protected _basesLayer: Container;
  protected _decksLayer: Container;

  constructor(settings: DealerSettings) {
    super();

    // Layers
    this._basesLayer = new Container();
    this._decksLayer = new Container();
    this.addChild(this._basesLayer);
    this.addChild(this._decksLayer);

    // Fundations
    for (let i = 0; i < settings.deck.amount; i++) {
      const position = {
        x:
          settings.deck.padding +
          settings.deck.width / 2 +
          i * (settings.deck.gap + settings.deck.width),
        y: settings.deck.padding + settings.deck.height / 2,
      };
      const base = settings.bases[i];
      base.x = position.x;
      base.y = position.y;
      this._basesLayer.addChild(base);

      const deck = new Deck();
      deck.x = position.x;
      deck.y = position.y;
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
