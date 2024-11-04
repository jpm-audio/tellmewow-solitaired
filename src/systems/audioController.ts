import AudioAdapter from './audioAdapter';
import gameAudioData from '../../public/assets/audios/gameAudio.json';
import { Game } from './game';
import {
  AnimationEventInfo,
  GameEvents,
  SuccessEventInfo,
} from '../constants/gameEvents';

export class AudioController {
  private _audio!: AudioAdapter;
  private _soundAlias: string = 'gameAudio';

  constructor() {
    this._audio = new AudioAdapter();
  }

  public async init(basePath: string = '') {
    const spriteUrls = Array.isArray(gameAudioData.url)
      ? gameAudioData.url
      : [gameAudioData.url];
    const parsedSpriteUrls: string[] = spriteUrls.map(
      (url) => `${basePath}/${url}`
    );

    await new Promise((resolve, reject) => {
      this._audio.add({
        [this._soundAlias]: {
          ...gameAudioData,
          ...{
            url: parsedSpriteUrls,
            preload: true,
            loaded: (err, sound) => {
              if (err) reject(err);
              else resolve(sound);
            },
          },
        },
      });
    });
  }

  public setActions() {
    if (!Game.bus) return;
    Game.bus.on(GameEvents.WIN, () => this.play('congrats'));
    Game.bus.on(GameEvents.ANIMATION, (info: AnimationEventInfo) => {
      if (info.name === 'cardFlip') {
        this.play('card-flip');
      }
    });
    Game.bus.on(GameEvents.TOUCH, () => this.play('card-touch'));
    Game.bus.on(GameEvents.DROP, () => this.play('card-drop'));
    Game.bus.on(GameEvents.SUCCESS, (info: SuccessEventInfo) => {
      if (info.level === 1) {
        this.play('card-success-big');
      } else {
        this.play('card-success');
      }
    });
  }

  public play(alias: string) {
    this._audio.play(this._soundAlias, alias);
  }
}
