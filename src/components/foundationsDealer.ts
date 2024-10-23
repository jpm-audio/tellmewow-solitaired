import { Dealer, DealerSettings, IntersectionResult } from './dealer';
import Deck from './deck';
import { Decks } from '../constants/cards';
import Card from './card';

export class FoundationsDealer extends Dealer {
  protected _name: Decks = 'foundation';

  constructor(settings: DealerSettings) {
    super();

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

  public checkIntersections(card: Card): IntersectionResult[] {
    const intersectedCards = super.checkIntersections(card);

    // Filter for cards with +1 value and different color
    return intersectedCards.filter((result) => {
      return (
        card.info.value === result.card.info.value + 1 &&
        card.testSuit(result.card)
      );
    });
  }
}
