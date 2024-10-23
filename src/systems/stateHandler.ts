import { EventEmitter } from 'pixi.js';
import { LocalStorage } from '../utils/localStorage';
import { CardInfo } from '../components/card';

export interface StateRegister {
  timeElapsed: number;
  cards: {
    stock: CardInfo[];
    waste: CardInfo[];
    foundations: CardInfo[][];
    tableu: CardInfo[][];
  };
}

const initState: StateRegister = {
  timeElapsed: 0,
  cards: {
    stock: [],
    waste: [],
    foundations: [],
    tableu: [],
  },
};

export class StateHandler extends EventEmitter {
  protected _initialized: boolean = false;
  protected _storageId: string = '';
  protected _state: StateRegister | null = null;
  protected _storage: LocalStorage | null = null;

  public get state() {
    return this._state !== null ? this._state : initState;
  }

  public setState(state: Partial<StateRegister>) {
    if (this._state === null) return;
    this._state = { ...this._state, ...state };
    this._save();
  }

  constructor(storageId: string = '') {
    super();

    // Set Storage for actions
    this._storageId = storageId;
    if (this._storageId !== '') {
      this._storage = new LocalStorage(this._storageId);
    }
  }

  protected _save() {
    if (this._storage !== null && this._state !== null) {
      this._storage.set(this._state);
    }
  }

  public init(): StateHandler {
    if (this._initialized) return this;
    this._initialized = true;

    // Check for stored Game State
    if (this._storage !== null) {
      this._state = this._storage.get() || initState;
    }

    return this;
  }

  public reset() {
    this._state = null;
    this._save();
    this.emit('reset');
  }
}
