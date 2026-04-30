/** SoundLibrary */

import { SceneNode } from 'engine';

const manifest = {
  footsteps: './audio/footsteps_brick.mp3',
  atmos: './audio/atmos.mp3',
};

class SoundLibrary extends SceneNode {
  constructor() {
    super({ name: 'SoundLibrary' });

    // props
    this._ready = false;
    this._readyCallbacks = [];

    // load sounds
    for (const key in manifest) {
      this.load(key, manifest[key]);
    }
  }

  /** @override */
  _init() {
    // initialise audio
    const audioHandler = SceneNode.getSceneNode('AudioHandler');
    audioHandler.onAudioContextCreate(() => {
      let toLoad = Object.keys(manifest).length;
      const onLoad = () => {
        if (--toLoad <= 0) {
          audioHandler.onAudioContextResume(() => this.onAudioContextResume());
        }
      };

      // process sound files
      for (const key in manifest) {
        const file = this.getAsset(key);
        const samples = 1;
        audioHandler.addSound(key, file, samples, onLoad);
      }
    });
  }

  /** assert ready */
  isReady() {
    return this._ready;
  }

  /** add onready callback */
  onReady(callback) {
    if (this._ready) {
      callback();
    } else {
      this._readyCallbacks.push(callback);
    }
  }

  /** on audiocontext resumed */
  onAudioContextResume() {
    this._ready = true;
    for (let i=this._readyCallbacks.length-1; i>=0; i--) {
      this._readyCallbacks[i]();
      this._readyCallbacks.splice(i, 1);
    }
  }
}

export default SoundLibrary;
