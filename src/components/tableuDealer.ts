import { Dealer, DealerSettings, IntersectionResult } from './dealer';
import Deck from './deck';
import Card from './card';
import { Decks } from '../constants/cards';
import { Point } from 'pixi.js';

export class TableuDealer extends Dealer {
  protected _name: Decks = 'tableu';

  constructor(settings: DealerSettings, maxHeight: number = 1000) {
    super(settings);

    const offset = {
      x: settings.deck.padding + settings.deck.width / 2,
      y: settings.deck.padding + settings.deck.height / 2,
    };

    for (let i = 0; i < settings.deck.amount; i++) {
      const position = {
        x: offset.x + i * (settings.deck.gap + settings.deck.width),
        y: offset.y,
      };
      const base = settings.bases[i];
      base.location = {
        deck: this._name,
        pile: i,
        position: -1,
      };
      base.position.copyFrom(position);
      this._basesLayer.addChild(base);

      const deck = new Deck(settings.deck.offset, maxHeight);
      deck.position.copyFrom(position);
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

    // Filter intersected by Dealer Rules
    return intersectedCards.filter((result) => {
      if (result.card.constructor.name === 'Card') {
        // Filter for cards with +1 value and different color
        const resultCard = result.card as Card;
        return (
          card.info.value + 1 === resultCard.info.value &&
          !card.testColor(resultCard as Card)
        );
      }

      if (result.card.constructor.name === 'CardBase') {
        // Filter for card is a "K", value of 13
        return card.info.value === 13;
      }

      return false;
    });
  }

  public async turnTopPileCard(pile: number = 0) {
    const deck = this.getPile(pile);
    const topCard = deck.topCard();
    if (topCard === null || topCard.isFront) return;
    await topCard.animateFlip(0.15);
  }

  public getDragCards(deckIndex: number, positionIndex: number = 0): Card[] {
    const deck = this.getPile(deckIndex);
    const cards: Card[] = [];

    if (deck && deck.numCards > positionIndex) {
      let card;
      do {
        card = deck.getCard(positionIndex);
        if (card !== null) {
          cards.push(card);
        }
      } while (card !== null);
    }
    return cards;
  }

  public async addCards(cards: Card[], deckIndex: number, offset?: Point) {
    super.addCards(cards, deckIndex, offset);

    // TODO: Add cards to the tableu
    await this.getPile(deckIndex).adaptHeight(true);
  }
}
