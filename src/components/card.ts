import { Sprite, Texture } from 'pixi.js';
import CARD_SUITS, { CardSuit } from '../constants/cards';
import { CardBase } from './cardBase';

export type CardInfo = {
  suit: CardSuit;
  value: number;
};

class Card extends CardBase {
  protected _info: CardInfo;
  protected _back: Sprite;
  protected _front: Sprite;

  public get info() {
    return this._info;
  }

  constructor(
    info: CardInfo,
    back: Texture | string,
    front: Texture | string,
    frontVisible: boolean = false
  ) {
    super();

    this._info = info;
    this._front = Sprite.from(front);
    this._back = Sprite.from(back);

    this._front.anchor.set(0.5, 0.5);
    this._back.anchor.set(0.5, 0.5);

    this.addChild(this._front);
    this.addChild(this._back);

    this.reset(frontVisible);
  }

  flip() {
    if (this._back.visible) {
      this.set('front');
    } else {
      this.set('back');
    }
  }

  set(way: 'front' | 'back') {
    const isFront = way === 'front';
    this._back.visible = !isFront;
    this._front.visible = isFront;
    this.eventMode = isFront ? 'dynamic' : 'none';
    this.cursor = isFront ? 'pointer' : 'default';
  }

  reset(frontVisible: boolean = false) {
    this._back.visible = !frontVisible;
    this._front.visible = frontVisible;
    this.x = 0;
    this.y = 0;
    this.scale.set(1);
    this.skew.set(0);
  }

  disable() {
    this.eventMode = 'none';
    this.cursor = 'default';
  }

  enable() {
    const isFront = this._front.visible;
    this.eventMode = isFront ? 'dynamic' : 'none';
    this.cursor = isFront ? 'pointer' : 'default';
  }

  testColor(card: Card): boolean {
    const cardSuit = card.info.suit;
    const thisSuit = this.info.suit;
    const cardColor =
      CARD_SUITS.find((suit) => suit.id === cardSuit)?.color || 'black';
    const thisColor =
      CARD_SUITS.find((suit) => suit.id === thisSuit)?.color || 'black';
    return thisColor === cardColor;
  }

  testSuit(card: Card): boolean {
    return this.info.suit === card.info.suit;
  }
}

export default Card;
