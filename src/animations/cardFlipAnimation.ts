import { Point, PointData } from 'pixi.js';
import Card from '../components/card';
import gsap from 'gsap';
import { Deferred } from '../utils/deferred';

export default class CardFlipAnimation {
  private _currentTweens: gsap.core.Tween[] = [];
  public scale: PointData | null = null;
  public skew: PointData | null = null;
  public flipOffset: PointData = { x: 0, y: 0 };
  public duration: number = 1;

  constructor(duration: number = 1) {
    this.duration = duration;
  }

  public async addPlay(
    card: Card,
    from: Point,
    to: Point,
    onFlip: () => void = () => {},
    onComplete: () => void = () => {}
  ) {
    const deferred = new Deferred<void>();
    const flipX = this.flipOffset.x + from.x + (to.x - from.x) / 2;
    const flipY = this.flipOffset.y + from.y + (to.y - from.y) / 2;
    card.x = from.x;
    card.y = from.y;
    const initScale = card.scale.clone();
    const initSkew = card.skew.clone();

    const tween1 = gsap.to(card, {
      x: flipX,
      y: flipY,
      pixi: {
        scaleX: this.scale ? this.scale.x : initScale.x,
        scaleY: this.scale ? this.scale.y : initScale.y,
        skewX: this.skew ? this.skew.x : initSkew.x,
        skewY: this.skew ? this.skew.y : initSkew.y,
      },
      duration: this.duration / 2,
      ease: 'power1.in',
    });
    tween1.pause();

    const tween2 = gsap.to(card, {
      x: to.x,
      y: to.y,
      pixi: {
        scaleX: initScale.x,
        scaleY: initScale.y,
        skewX: initSkew.x,
        skewY: initSkew.y,
      },
      duration: this.duration / 2,
      ease: 'sine.out',
      onComplete: onComplete,
    });
    tween2.pause();

    this._currentTweens.push(tween1);

    tween1.vars.onComplete = () => {
      this._currentTweens.splice(this._currentTweens.indexOf(tween1), 1);
      this._currentTweens.push(tween2);
      onFlip();
      tween2.play();
    };

    tween2.vars.onComplete = () => {
      this._currentTweens.splice(this._currentTweens.indexOf(tween2), 1);
      deferred.resolve();
      onComplete();
    };

    tween1.play();

    await deferred.promise;
  }

  pause() {
    this._currentTweens.forEach((tween) => tween.pause());
  }

  resume() {
    this._currentTweens.forEach((tween) => tween.resume());
  }

  stop() {
    this._currentTweens.forEach((tween) => tween.kill());
    this._currentTweens = [];
  }
}
