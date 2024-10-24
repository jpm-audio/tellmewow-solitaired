import { Dealer, DealerSettings, IntersectionResult } from './dealer';
import Deck from './deck';
import CARD_SUITS, { Decks } from '../constants/cards';
import Card from './card';

export class FoundationsDealer extends Dealer {
  protected _name: Decks = 'foundation';

  constructor(settings: DealerSettings) {
    super(settings);

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
      base.location = {
        deck: this._name,
        pile: i,
        position: -1,
      };
      base.position.copyFrom(position);
      this._basesLayer.addChild(base);

      const deck = new Deck();
      deck.position.copyFrom(position);
      this._decksLayer.addChild(deck);
    }
  }

  public checkIntersections(card: Card): IntersectionResult[] {
    const intersectedCards = super.checkIntersections(card);

    // Filter for cards with +1 value and different color
    return intersectedCards.filter((result) => {
      if (result.card.constructor.name === 'Card') {
        const resultCard = result.card as Card;
        return (
          card.info.value === resultCard.info.value + 1 &&
          card.testSuit(resultCard)
        );
      }

      if (result.card.constructor.name === 'CardBase') {
        // Filter for card is a "A", value of 1
        return card.info.value === 1;
      }

      return false;
    });
  }

  public checkWin(): boolean {
    const fullDecks = this._decksLayer.children.filter((deck) => {
      const pile = deck as Deck;
      return pile.numCards === CARD_SUITS[0].values;
    });
    return fullDecks.length === CARD_SUITS.length;
  }
}
