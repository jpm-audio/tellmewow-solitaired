import { Point, Sprite, Texture } from 'pixi.js';
import CARD_SUITS, { CardSuit } from '../constants/cards';
import { CardBase } from './cardBase';
import CardFlipAnimation from '../animations/cardFlipAnimation';

export type CardInfo = {
  suit: CardSuit;
  value: number;
  way: 'front' | 'back';
};

class Card extends CardBase {
  protected _info: CardInfo;
  protected _back: Sprite;
  protected _front: Sprite;
  protected _flipAnimation: CardFlipAnimation;
  protected _defaultFlipAnimationDuration: number = 0.15;

  public get info() {
    return this._info;
  }

  public get isFront() {
    return this._front.visible;
  }

  constructor(
    info: CardInfo,
    back: Texture | string,
    front: Texture | string,
    frontVisible: boolean = false
  ) {
    super();

    this._flipAnimation = new CardFlipAnimation(
      this._defaultFlipAnimationDuration
    );

    this._info = info;
    this._front = Sprite.from(front);
    this._back = Sprite.from(back);

    this._front.anchor.set(0.5, 0.5);
    this._back.anchor.set(0.5, 0.5);

    this.addChild(this._front);
    this.addChild(this._back);

    this.reset(frontVisible);
  }

  public flip() {
    if (this._back.visible) {
      this.set('front');
    } else {
      this.set('back');
    }
  }

  public async animateFlip(
    duration: number = this._defaultFlipAnimationDuration,
    from: Point = this.position,
    to: Point = this.position
  ) {
    const originalScale = this.scale.y;

    this._flipAnimation.duration = duration;
    this._flipAnimation.scale = { x: 0, y: originalScale };

    await this._flipAnimation.addPlay(this, from, to, () => this.flip());
  }

  public set(way: 'front' | 'back') {
    const isFront = way === 'front';
    this._back.visible = !isFront;
    this._front.visible = isFront;
    this.eventMode = isFront ? 'dynamic' : 'none';
    this.cursor = isFront ? 'pointer' : 'default';
    this.info.way = way;
  }

  public reset(frontVisible: boolean = false) {
    this._back.visible = !frontVisible;
    this._front.visible = frontVisible;
    this.x = 0;
    this.y = 0;
    this.scale.set(1);
    this.skew.set(0);
  }

  public disable() {
    this.eventMode = 'none';
    this.cursor = 'default';
  }

  public enable() {
    const isFront = this._front.visible;
    this.eventMode = isFront ? 'dynamic' : 'none';
    this.cursor = isFront ? 'pointer' : 'default';
  }

  public testColor(card: Card): boolean {
    const cardSuit = card.info.suit;
    const thisSuit = this.info.suit;
    const cardColor =
      CARD_SUITS.find((suit) => suit.id === cardSuit)?.color || 'black';
    const thisColor =
      CARD_SUITS.find((suit) => suit.id === thisSuit)?.color || 'black';
    return thisColor === cardColor;
  }

  public testSuit(card: Card): boolean {
    return this.info.suit === card.info.suit;
  }
}

export default Card;
