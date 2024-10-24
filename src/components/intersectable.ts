import { Container } from 'pixi.js';

export class Intersectable extends Container {
  testIntersection(other: Intersectable): number {
    const bounds1 = this.getBounds();
    const bounds2 = other.getBounds();

    const deltaX =
      bounds1.x < bounds2.x
        ? bounds1.x + bounds1.width - bounds2.x
        : bounds2.x + bounds2.width - bounds1.x;
    const deltaY =
      bounds1.y < bounds2.y
        ? bounds1.y + bounds1.height - bounds2.y
        : bounds2.y + bounds2.height - bounds1.y;
    const intersectionArea =
      deltaX > 0 && deltaY > 0
        ? (deltaX * deltaY) / (bounds1.width * bounds1.height)
        : 0;

    return intersectionArea;
  }
}
