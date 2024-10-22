import { Actions, CardSuitInfo, Decks } from '../constants/cards';
import { LocalStorage } from '../utils/localStorage';

export interface CardLocation {
  from: Decks;
  fromPile: number;
  fromPosition: number;
}

export interface GameAction {
  action: Actions;
  card: CardSuitInfo;
  from: CardLocation;
  to: CardLocation;
}

export interface GameActionRegister {
  action: Actions;
  undo: boolean;
  redo: boolean;
  card: CardSuitInfo;
  from: CardLocation;
  to: CardLocation;
}

export default class GameController {
  protected _storageActionsId: string = '';
  protected _actions: GameActionRegister[] = [];
  protected _storage: LocalStorage | null = null;

  public get numTotalActions() {
    return this._actions.length;
  }

  public get numDoneActions() {
    return this._actions.filter((action) => !action.undo).length;
  }

  constructor(storageActionsId: string = '') {
    // Set Storage for actions
    this._storageActionsId = storageActionsId;
    if (this._storageActionsId !== '') {
      this._storage = new LocalStorage(this._storageActionsId);
    }

    // Set Storage for Game State
    // TODO
  }

  protected _save() {
    if (this._storage !== null) {
      this._storage.set(this._actions);
    }
  }

  public init(): GameController {
    // Check for stored actions
    if (this._storage !== null) {
      this._actions = this._storage.get();
    }

    // Check for stored Game State
    // TODO

    return this;
  }

  public action(actionInfo: GameAction): GameController {
    this._actions.push({ ...actionInfo, undo: false, redo: false });
    this._save();

    // Execute the action
    // TODO

    return this;
  }

  public undo(): GameController {
    if (this._actions.length === 0) return this;

    const lastAction = this._actions[this._actions.length - 1];

    // Undo the action (inverse from - to)
    // TODO

    lastAction.undo = true;
    this._save();

    return this;
  }
}
