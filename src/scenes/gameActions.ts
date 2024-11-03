import { ActionRegister } from '../systems/actionsHandler';
import SceneBuilder from './sceneBuilder';

export interface GameAction {
  id: string;
  callback: (
    actionRegister: ActionRegister,
    scene: SceneBuilder
  ) => Promise<void>;
  moveAdd: number;
  passthrusAdd: number;
}
