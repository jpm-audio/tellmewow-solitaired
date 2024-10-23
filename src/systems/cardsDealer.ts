import { Container, EventEmitter, Point, PointData } from 'pixi.js';
import Card, { CardInfo } from '../components/card';
import { CardSuitInfo } from '../constants/cards';

export class CardsDealer extends EventEmitter {
  private _cards: Card[] = [];
  private _hand: number[] = [];

  public init(
    cardsSuitInfo: CardSuitInfo[],
    onCardCreated?: (card: Card) => void
  ) {
    cardsSuitInfo.forEach((suit) => {
      for (let i = 1; i < suit.values + 1; i++) {
        const card = new Card(
          { suit: suit.id, value: i },
          'back_red.png',
          `${suit.id}_${i}.png`
        );

        if (onCardCreated !== undefined) {
          onCardCreated(card);
        }

        this._cards.push(card);
      }
    });
  }

  public getCardGlobalCoords(card: Card): PointData {
    const coords = new Point();
    let container: Container = card;

    while (container !== null) {
      coords.x += container.x;
      coords.y += container.y;
      container = container.parent;
    }

    return coords;
  }

  public getCardByIndex(index: number = 0): Card | null {
    return this._cards[index];
  }

  public getCardByInfo(info: CardInfo): Card | null {
    return (
      this._cards.find(
        (card) => card.info.suit === info.suit && card.info.value === info.value
      ) || null
    );
  }

  public shuffle() {
    this._hand = [];
    this._cards.forEach((card, index) => {
      this._hand.push(index);
    });
  }

  public getHandCards(numCards: number = 1): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < numCards; i++) {
      const index = Math.floor(Math.random() * this._hand.length);
      const cardIndex = this._hand.splice(index, 1)[0];
      cards.push(this._cards[cardIndex]);
    }

    return cards;
  }

  public getStock(): Card[] {
    return this.getHandCards(this._hand.length);
  }
}
