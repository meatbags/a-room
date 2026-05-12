/** Footsteps */

import { SceneNode } from 'engine';
import { Vector3 } from 'three';

const FOOTSTEPS_STRIDE = 1.1;
const FOOTSTEPS_STRIDE_RUNNING = FOOTSTEPS_STRIDE * 1.5;
const FOOTSTEPS_STRIDE_CROUCHING = FOOTSTEPS_STRIDE * 0.42;
const FOOTSTEPS_GAIN = 0.2;
const FOOTSTEPS_GAIN_RUNNING = 0.35;
const FOOTSTEPS_GAIN_CROUCHING = 0.1;
const FOOTSTEPS_FOOT_OFFSET = 0.04;
const FOOTSTEPS_FOOT_OFFSET_FORWARD = 0.1;
const FOOTSTEPS_FOOT_OFFSET_Y = -0.5;
const FOOTSTEPS_SAMPLES_PER_STEP = 8;
const FOOTSTEPS_DURATION = 1;

class Footsteps extends SceneNode {
  constructor() {
    super({ name: 'Footsteps' });

    // internal
    this._worldDirection = new Vector3();
  }

  /** @override */
  _init() {
    // refs
    this.refPlayer = this._getSceneNode('Player');
    this.refCamera = this._getSceneNode('Camera');
    this.refAudioHandler = this._getSceneNode('AudioHandler');

    // bind
    this._getSceneNode('SoundLibrary').onReady(() => {
      this.onSoundsReady();
    });
  }

  /** on audio loaded */
  onSoundsReady() {
    // footsteps state
    this.footsteps = {
      zone: null,
      side: 1,
      distance: 0,
      lastOffset: -1,
      reverb: this.refAudioHandler.getReverbInput({
        name: 'footsteps_reverb',
        wet: 0.75,
        duration: 2.5,
      })
    };

    // player move event
    this.refPlayer.addEventListener('move_grounded', position => {
      this.onPlayerMoveGrounded(position);
    });
  }

  /** on player move grounded */
  onPlayerMoveGrounded(position) {
    // update footsteps trigger
    this.footsteps.distance += this.refPlayer.getDistanceMoved2d();
    const running = this.refPlayer.getRunning();
    const crouching = this.refPlayer.getCrouching();
    const stride = running ? FOOTSTEPS_STRIDE_RUNNING
      : crouching ? FOOTSTEPS_STRIDE_CROUCHING : FOOTSTEPS_STRIDE;
    const gain = running ? FOOTSTEPS_GAIN_RUNNING
      : crouching ? FOOTSTEPS_GAIN_CROUCHING : FOOTSTEPS_GAIN;
    if (this.footsteps.distance < stride) {
      return;
    }
    this.footsteps.distance %= stride;
    this.footsteps.side = this.footsteps.side === 1 ? 0 : 1;

    // get sample offset
    const indexBase = 0;
    let indexStep = Math.floor(Math.random() * FOOTSTEPS_SAMPLES_PER_STEP);
    if (this.footsteps.lastOffset === indexBase + indexStep) {
      indexStep = (indexStep + 1) % FOOTSTEPS_SAMPLES_PER_STEP;
    }
    this.footsteps.lastOffset = indexBase + indexStep;
    const offset = (indexBase + indexStep) * FOOTSTEPS_DURATION;

    // get panner node position
    const dir = this.refCamera.getWorldDirection(this._worldDirection);
    const sign = this.footsteps.side ? 1 : -1;
    const p = {
      x: position.x
        - dir.z * sign * FOOTSTEPS_FOOT_OFFSET
        + dir.x * FOOTSTEPS_FOOT_OFFSET_FORWARD,
      y: position.y + FOOTSTEPS_FOOT_OFFSET_Y,
      z: position.z
        + dir.x * sign * FOOTSTEPS_FOOT_OFFSET
        + dir.z * FOOTSTEPS_FOOT_OFFSET_FORWARD
    };

    // play sound
    this.refAudioHandler.playSound('footsteps', {
      loop: false,
      offset: offset,
      duration: FOOTSTEPS_DURATION,
      position: p,
      gain: gain,
      destination: this.footsteps.reverb,
    });
  }

  /** zone changed callback */
  __FUTURE_onZoneChange(map) {
    this.footsteps.zone = 'default';
  }
}

export default Footsteps;
