import { CardLocation } from '../systems/actionsHandler';
import { Intersectable } from './intersectable';

export class CardBase extends Intersectable {
  public location: CardLocation | null = null;
}
