import { EventEmitter } from 'pixi.js';
import { Actions, Decks } from '../constants/cards';
import { LocalStorage } from '../utils/localStorage';
import { interactionDefinition, VirtualPlayer } from './virtualPlayer';
import { CardInfo } from '../components/card';

export interface CardLocation {
  deck: Decks;
  pile: number;
  position: number;
}

export interface Action {
  action: Actions;
  card?: CardInfo;
  from?: CardLocation;
  to?: CardLocation;
}

export interface ActionRegister extends Action {
  undo: boolean;
  redo: boolean;
}

export default class ActionsHandler extends EventEmitter {
  protected _initialized: boolean = false;
  protected _storageId: string = '';
  protected _actions: ActionRegister[] = [];
  protected _storage: LocalStorage | null = null;
  protected _virtualPlayer: VirtualPlayer | null = null;

  public get numTotalActions() {
    return this._actions.length;
  }

  public get numDoneActions() {
    return this._actions.filter((action) => !action.undo).length;
  }

  constructor(storageId: string = '') {
    super();

    // Virtual Player
    this._virtualPlayer = new VirtualPlayer();

    // Set Storage for actions
    this._storageId = storageId;
    if (this._storageId !== '') {
      this._storage = new LocalStorage(this._storageId);
    }
  }

  protected _save() {
    if (this._storage !== null) {
      this._storage.set(this._actions);
    }
  }

  public init(): ActionsHandler {
    if (this._initialized) return this;
    this._initialized = true;

    // Check for stored actions
    if (this._storage !== null) {
      this._actions = this._storage.get() || [];
    }
    return this;
  }

  public subscribeAction(interaction: interactionDefinition) {
    this._virtualPlayer?.addInteraction(interaction);
  }

  public async do(actionInfo: Action): Promise<ActionsHandler> {
    const actionRegister: ActionRegister = {
      ...actionInfo,
      undo: false,
      redo: false,
    };
    await this._virtualPlayer?.interact(actionRegister);
    this._actions.push(actionRegister);
    this._save();
    return this;
  }

  public async undo(): Promise<ActionsHandler> {
    if (this._actions.length === 0) return this;

    const actionRegister: ActionRegister | undefined = this._actions.pop();

    // Undo the action (inverse from - to)
    if (actionRegister) {
      actionRegister.undo = true;
      await this._virtualPlayer?.interact(actionRegister);

      this._save();
    }
    return this;
  }

  public reset() {
    this._actions = [];
    this._save();
    this.emit('reset');
  }
}
