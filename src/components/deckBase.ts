import { Sprite, Text } from 'pixi.js';
import { CardBase } from './cardBase';

export class DeckBase {
  static config = {
    backTexture: 'back_red.png',
    baseTexture: 'card_base-2.png',
    redoTexture: 'redo.png',
    baseLogoTexture: 'logo-black.png',
  };

  static base(variant: number = 0, width: number, height: number) {
    const base = new CardBase();
    if (variant === 1) {
      const base1 = Sprite.from(DeckBase.config.baseTexture);
      base1.height = height;
      base1.width = width;
      base1.anchor.set(0.5);
      base.addChild(base1);

      const baseLogo = Sprite.from(DeckBase.config.baseLogoTexture);
      baseLogo.scale.set(0.75);
      baseLogo.anchor.set(0.5);
      base.addChild(baseLogo);

      return base;
    }

    if (variant === 2) {
      const base1 = Sprite.from(DeckBase.config.baseTexture);
      base1.height = height;
      base1.width = width;
      base1.anchor.set(0.5);
      base.addChild(base1);

      const baseRedo = Sprite.from(DeckBase.config.redoTexture);
      baseRedo.anchor.set(0.5, 0.75);
      base.addChild(baseRedo);

      const text = new Text({
        text: 'REDEAL',
        style: {
          fontFamily: 'Arial',
          fontSize: 32,
        },
      });
      text.alpha = 0.5;
      text.anchor.set(0.5);
      text.y = 50;
      base.addChild(text);

      return base;
    }

    const base1 = Sprite.from(DeckBase.config.baseTexture);
    base.addChild(base1);
    base1.height = height;
    base1.width = width;
    base1.anchor.set(0.5);

    return base;
  }
}
