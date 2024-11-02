export enum GameEvents {
  READY = 'gameReady',
  NEW = 'gameNew',
  RESTART = 'gameRestart',
  UNDO = 'gameUndo',
  TOUCH = 'gameTouch',
  DROP = 'gameDrop',
  SUCCESS = 'gameSuccess',
  FAIL = 'gameFail',
  WIN = 'gameWin',
  ANIMATION = 'gameAnimation',
}

export interface AnimationEventInfo {
  name: string;
  type: 'tween' | 'sequence';
  duration: number;
}

export interface SuccessEventInfo {
  level: number;
}
