import './global.css';
import { Application, Assets } from 'pixi.js';
import { SolitaireScene } from './scenes/solitaireScene';
import debounce from './utils/debounce';

(async () => {
  const app = new Application();
  const resolution = 1;
  const canvasContainerEl: HTMLElement | null =
    document.querySelector('#canvas_container');

  if (canvasContainerEl === null) {
    throw new Error('Canvas container not found');
  }

  await app.init({ backgroundAlpha: 0, resizeTo: canvasContainerEl });

  canvasContainerEl.appendChild(app.canvas);

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
