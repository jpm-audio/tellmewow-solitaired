import './global.css';
import { Application, Assets, Container, Sprite } from 'pixi.js';
import { SolitaireScene } from './scenes/solitaireScene';
import debounce from './utils/debounce';
import gsap from 'gsap';
import PixiPlugin from 'gsap/PixiPlugin';

(async () => {
  const app = new Application();
  const resolution = 1;
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

  Assets.add([
    {
      alias: 'main',
      src: `/assets/sprites/main-0${
        resolution === 1 ? '' : `x${resolution}`
      }.json`,
    },
  ]);

  await Assets.load(['main'], (prog) => {
    console.log(prog);
  });

  // Start scene
  const scene = new SolitaireScene();
  app.stage.addChild(scene);

  await scene.init(app);

  const onResize = () => {
    app.resize();
    scene.updateSize(app);
  };

  // Add resize listener
  window.addEventListener('resize', debounce(onResize.bind(this), 300));

  scene.updateSize(app);
})();
