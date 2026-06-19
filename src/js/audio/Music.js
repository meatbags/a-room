/** Music */

import { SceneNode, Blend } from 'engine';

const ATMOS_GAIN = 0.5;

class Music extends SceneNode {
  constructor() {
    super({ name: 'Music' });
  }

  /** init */
  _init() {
    this._getSceneNode('SoundLibrary').onReady(() => {
      this.onReady();
    });
  }

  /** on audio handler ready */
  onReady() {
    const audioHandler = SceneNode.getSceneNode('AudioHandler');
    audioHandler.playSound('atmos', {
      loop: true,
      gain: ATMOS_GAIN,
    });
  }
}

export default Music;