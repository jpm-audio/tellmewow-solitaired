import { sound, SoundSourceMap } from '@pixi/sound';

export default class AudioAdapter {
  public add(map: SoundSourceMap) {
    return sound.add(map);
  }

  public play(alias: string, spriteName: string) {
    return sound.play(alias, spriteName);
  }
}
