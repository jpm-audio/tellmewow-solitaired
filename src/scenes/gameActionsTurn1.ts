import { ActionRegister } from '../systems/actionsHandler';
import { GameAction } from './gameActions';
import SceneBuilder from './sceneBuilder';
import { SceneBuilderTurn1 } from './sceneBuilderTurn1';

export const GAME_ACTIONS_TURN_1: GameAction[] = [
  {
    id: 'deal',
    callback: async (
      actionRegister: ActionRegister,
      sceneBuilder: SceneBuilder
    ) => {
      const scene = sceneBuilder as SceneBuilderTurn1;
      if (actionRegister.undo) {
        await scene.deckDealer.undeal();
      } else {
        await scene.deckDealer.deal();
      }
    },
    moveAdd: 1,
    passthrusAdd: 0,
  },
  {
    id: 'redeal',
    callback: async (
      actionRegister: ActionRegister,
      sceneBuilder: SceneBuilder
    ) => {
      const scene = sceneBuilder as SceneBuilderTurn1;

      if (actionRegister.undo) {
        await scene.deckDealer.unredeal();
      } else {
        await scene.deckDealer.redeal();
      }
    },
    moveAdd: 1,
    passthrusAdd: 1,
  },
];
