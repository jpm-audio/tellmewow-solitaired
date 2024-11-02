import './global.css';
import { Application, Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import PixiPlugin from 'gsap/PixiPlugin';
import { Game } from './systems/game';

(async () => {
  const app = new Application();
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
  await Game.game.init(app);
})();
