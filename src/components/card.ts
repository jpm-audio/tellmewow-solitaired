import { Container, Sprite, Texture } from 'pixi.js';
import { CardSuit } from '../constants/cards';

export type CardInfo = {
  suit: CardSuit;
  value: number;
};

class Card extends Container {
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
    this._back.visible = !this._back.visible;
    this._front.visible = !this._front.visible;
  }

  set(way: 'front' | 'back') {
    const isFront = way === 'front';
    this._back.visible = !isFront;
    this._front.visible = isFront;
  }

  reset(frontVisible: boolean = false) {
    this._back.visible = !frontVisible;
    this._front.visible = frontVisible;
    this.x = 0;
    this.y = 0;
    this.scale.set(1);
    this.skew.set(0);
  }
}

export default Card;
