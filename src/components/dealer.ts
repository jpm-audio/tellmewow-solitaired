import { Container, PointData, Sprite } from 'pixi.js';

export interface DealerSettings {
  deck: {
    amount: number;
    padding: number;
    gap: number;
    width: number;
    height: number;
    offset?: PointData;
  };
  bases: Array<Sprite | Container>;
}

export class Dealer extends Container {}
