import './global.css';
import { Application, Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import PixiPlugin from 'gsap/PixiPlugin';
import { GameController } from './systems/gameController';
import { sound } from '@pixi/sound';

(async () => {
  const app = new Application();
  const game = new GameController(app);
  const canvasContainerEl: HTMLElement | null =
    document.querySelector('#canvas_container');

  if (canvasContainerEl === null) {
    throw new Error('Canvas container not found');
  }

  // Init PIXI
  await app.init({ backgroundAlpha: 0, resizeTo: canvasContainerEl });
  canvasContainerEl.appendChild(app.canvas);

  // Init Audio
  sound.add('card-touch', '/assets/audios/card-touch.mp3');
  sound.add('card-drop', '/assets/audios/card-drop.mp3');
  sound.add('card-flip', '/assets/audios/card-flip-4.mp3');
  sound.add('card-nice', '/assets/audios/card-success.mp3');
  sound.add('card-great', '/assets/audios/card-success-big.mp3');
  sound.add('congrats', '/assets/audios/congrats.mp3');

  // Init GSAP
  gsap.registerPlugin(PixiPlugin);
  PixiPlugin.registerPIXI({ Container, Sprite });

  // Init Game
  await game.init();
})();
