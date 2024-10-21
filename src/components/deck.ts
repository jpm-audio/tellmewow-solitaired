import { Container, Point, PointData } from 'pixi.js';
import Card from './card';

class Deck extends Container {
  public ADD_CARD_OFFSET = { x: -1, y: -2 };
  public COUNTER_GAP = 20;
  private _cardsContainer: Container;

  public get numCards() {
    return this._cardsContainer.children.length;
  }

  public set counterGap(value: number) {
    this.COUNTER_GAP = value;
  }

  constructor(addCardOffset: PointData = { x: 0, y: 0 }) {
    super();
    this.ADD_CARD_OFFSET = addCardOffset;

    this._cardsContainer = new Container();
    this.addChild(this._cardsContainer);
  }

  getTheoricalWidth() {
    return this.width + this.numCards * Math.abs(this.ADD_CARD_OFFSET.x);
  }

  getTheoricalHeight() {
    return this.height + this.numCards * Math.abs(this.ADD_CARD_OFFSET.y);
  }

  addCard(card: Card, way: 'front' | 'back' = 'front') {
    card.x = this.numCards * this.ADD_CARD_OFFSET.x;
    card.y = this.numCards * this.ADD_CARD_OFFSET.y;
    card.set(way);
    this._cardsContainer.addChild(card);
  }

  getCard(index: number = this.numCards - 1): Card | null {
    if (this.numCards === 0) return null;

    const card = this._cardsContainer.removeChildAt<Card>(index);
    return card;
  }

  getNextCardCoordinates(offset: number = 0): Point {
    return new Point(
      (this.numCards + offset) * this.ADD_CARD_OFFSET.x,
      (this.numCards + offset) * this.ADD_CARD_OFFSET.y
    );
  }

  reset() {
    this._cardsContainer.removeChildren();
  }
}

export default Deck;