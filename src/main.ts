import './global.css';
import { Application, Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import PixiPlugin from 'gsap/PixiPlugin';
import { GameController } from './systems/gameController';

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

  // Init GSAP
  gsap.registerPlugin(PixiPlugin);
  PixiPlugin.registerPIXI({ Container, Sprite });

  // Init Game
  await game.init();
})();
