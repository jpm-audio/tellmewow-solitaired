import './global.css';
import { Application } from 'pixi.js';

(async () => {
  const app = new Application();

  await app.init({ backgroundAlpha: 0, resizeTo: window });

  document.querySelector('#canvas_container')?.appendChild(app.canvas);
})();
