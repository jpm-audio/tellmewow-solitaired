import { Dealer, DealerSettings, IntersectionResult } from './dealer';
import Deck from './deck';
import Card from './card';
import { Decks } from '../constants/cards';

export class TableuDealer extends Dealer {
  protected _name: Decks = 'tableu';

  constructor(settings: DealerSettings) {
    super();

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

  public checkIntersections(card: Card): IntersectionResult[] {
    const intersectedCards = super.checkIntersections(card);

    // Filter for cards with +1 value and different color
    return intersectedCards.filter((result) => {
      return (
        card.info.value + 1 === result.card.info.value &&
        !card.testColor(result.card)
      );
    });
  }
}
