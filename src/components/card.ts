import { Container, Sprite, Texture } from 'pixi.js';
import { CardSuit } from '../constants/cards';
import { CardLocation } from '../systems/actionsHandler';

export type CardInfo = {
  suit: CardSuit;
  value: number;
};

class Card extends Container {
  protected _info: CardInfo;
  protected _back: Sprite;
  protected _front: Sprite;
  public location: CardLocation | null = null;

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

    this.on('dragStart', (event) => this.emit('cardDragStart', this, event));
    this.on('dragEnd', () => this.emit('cardDragEnd', this));
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
}

export default Card;
