import { Container, Point, PointData } from 'pixi.js';
import Card from './card';
import gsap from 'gsap';

class Deck extends Container {
  public ADD_CARD_OFFSET = { x: -1, y: -2 };
  public MAX_HEIGHT = 2000;
  public currentOffset = 0;
  private _cardsContainer: Container;

  public get numCards() {
    return this._cardsContainer.children.length;
  }

  constructor(
    addCardOffset: PointData = { x: 0, y: 0 },
    maxHeight: number = 2000
  ) {
    super();
    this.ADD_CARD_OFFSET = addCardOffset;
    this.currentOffset = this.ADD_CARD_OFFSET.y;
    this.MAX_HEIGHT = maxHeight;

    this._cardsContainer = new Container();
    this.addChild(this._cardsContainer);
  }

  getTheoricalWidth() {
    return this.width + this.numCards * Math.abs(this.ADD_CARD_OFFSET.x);
  }

  getTheoricalHeight() {
    return this.height + this.numCards * Math.abs(this.ADD_CARD_OFFSET.y);
  }

  async adaptHeight(animate: boolean = false) {
    if (this.numCards > 1) {
      // Calculate a target offset
      const firstCard = this._cardsContainer.getChildAt(0);
      const cardHeight = firstCard.height;
      let targetOffset = 0;
      if (cardHeight < this.MAX_HEIGHT) {
        const maxOffset = (this.MAX_HEIGHT - cardHeight) / (this.numCards - 1);
        targetOffset = Math.min(maxOffset, this.ADD_CARD_OFFSET.y);
      }

      // Animate
      if (!animate) {
        this._cardsContainer.children.forEach((card, index) => {
          card.y = targetOffset * index;
        });
        this.currentOffset = targetOffset;
      } else {
        const tween = gsap.to(this, {
          currentOffset: targetOffset,
          duration: 0.15,
          ease: 'sine.inout',
          onUpdate: () => {
            this._cardsContainer.children.forEach((card, index) => {
              card.y = this.currentOffset * index;
            });
          },
        });
        await tween.play();
      }
    }
  }

  addCard(card: Card, way?: 'front' | 'back', offset?: Point) {
    const cardOffsetX =
      offset !== undefined ? offset.x : this.ADD_CARD_OFFSET.x;
    const cardOffsetY = offset !== undefined ? offset.y : this.currentOffset;
    card.x = this.numCards * cardOffsetX;
    card.y = this.numCards * cardOffsetY;
    if (way) {
      card.set(way);
    }
    this._cardsContainer.addChild(card);
  }

  getCard(index: number = this.numCards - 1): Card | null {
    if (this.numCards <= index) return null;
    const card = this._cardsContainer.removeChildAt<Card>(index);
    return card;
  }

  seeCards() {
    return this._cardsContainer.children as Card[];
  }

  seeCard(index: number = this.numCards - 1): Card | null {
    return this._cardsContainer.children[index] as Card;
  }

  topCard(): Card | null {
    return (
      (this._cardsContainer.children[
        this._cardsContainer.children.length - 1
      ] as Card) || null
    );
  }

  getNextCardCoordinates(offset: number = 0): Point {
    return new Point(
      (this.numCards + offset) * this.ADD_CARD_OFFSET.x,
      (this.numCards + offset) * this.ADD_CARD_OFFSET.y
    );
  }

  reset() {
    const children: Card[] = [];
    this._cardsContainer.children.forEach((child) => {
      children.unshift(child as Card);
    });
    this._cardsContainer.removeChildren();

    this.currentOffset = this.ADD_CARD_OFFSET.y;

    return children;
  }
}

export default Deck;
