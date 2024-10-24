import { EventEmitter } from 'pixi.js';
import { LocalStorage } from '../utils/localStorage';
import { CardInfo } from '../components/card';
import { CardLocation } from './actionsHandler';

export interface CardState {
  info: CardInfo;
  location: CardLocation;
}

export interface StatsState {
  moves: number;
  stock: number;
  passthrus: number;
}

export interface StateRegister {
  timeElapsed: number;
  stats: StatsState;
  cards: {
    dealer: CardState[][];
    foundations: CardState[][];
    tableu: CardState[][];
  };
}

const initState: StateRegister = {
  timeElapsed: 0,
  stats: {
    moves: 0,
    stock: 0,
    passthrus: 0,
  },
  cards: {
    dealer: [],
    foundations: [],
    tableu: [],
  },
};

export class StateHandler extends EventEmitter {
  protected _initialized: boolean = false;
  protected _currentGameStorageId: string = '';
  protected _state: StateRegister | null = null;
  protected _currentGameStorage: LocalStorage | null = null;
  protected _initalGameStorage: LocalStorage | null = null;

  public get state() {
    return this._state !== null ? this._state : initState;
  }

  public get hasGameSet() {
    return this._state?.cards.foundations.length !== 0;
  }

  public setState(state: Partial<StateRegister>) {
    if (this._state === null) return;
    this._state = { ...this._state, ...state };
    this._save();
    this.emit('stateChange', this._state);
  }

  constructor(storageId: string = '') {
    super();

    // Set Storage for actions
    this._currentGameStorageId = storageId;
    if (this._currentGameStorageId !== '') {
      this._currentGameStorage = new LocalStorage(this._currentGameStorageId);
      this._initalGameStorage = new LocalStorage(
        `initial-${this._currentGameStorageId}`
      );
    }
  }

  protected _save() {
    if (this._currentGameStorage !== null && this._state !== null) {
      this._currentGameStorage.set(this._state);
    }
  }

  public init(): StateHandler {
    if (this._initialized) return this;
    this._initialized = true;

    // Check for stored Game State
    if (this._currentGameStorage !== null) {
      this._state = this._currentGameStorage.get() || initState;
    }

    return this;
  }

  public saveInitalState() {
    if (this._initalGameStorage !== null && this._state !== null) {
      this._initalGameStorage.set(this._state);
    }
  }

  public loadInitialState() {
    if (this._initalGameStorage !== null) {
      this._state = this._initalGameStorage.get() || null;
      this._save();
    }
    return this;
  }

  public reset() {
    this._state = null;
    this._save();
    this.emit('reset');
  }
}
