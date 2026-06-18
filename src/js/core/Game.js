/** Game */

import { SceneNode, Stats } from 'engine';
// import Stats from 'three/addons/libs/stats.module.js';
import Footsteps from '../audio/Footsteps';
import Music from '../audio/Music';
import SoundLibrary from '../audio/SoundLibrary';
import Map from '../scenes/Map';
import Lighting from './Lighting';
import Fog from '../scenes/Fog';
import SharedAssets from '../objects/SharedAssets';

// scene
import Overworld from '../scenes/Overworld';
import Room_01 from '../scenes/Room_01';
import Room_02 from '../scenes/Room_02';

const FALL_THRESHOLD = -32;
const RESET_POSITION = {x:0, y:0.125, z:96};
const RESET_DIRECTION = {pitch:0, yaw:0};

class Game extends SceneNode {
  constructor() {
    super({ name: 'Game' });

    // sound
    this.add( new SoundLibrary() );
    this.add( new Footsteps() );
    this.add( new Music() );

    // environment
    this.add( new Lighting() );
    this.add( new SharedAssets() );

    // overworld
    this.add( new Overworld() );

    // individual rooms
    this.add( new Room_01() );
    this.add( new Room_02() );
  }

  _init() {
    this.resetPlayer();

    if (SceneNode.getSceneNode('Dev').isDev) {
      // FPS
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
      this.stats.dom.style.left = 'auto';
      this.stats.dom.style.right = '0px';
      this.stats.begin();
    }
  }

  resetPlayer() {
    SceneNode.getSceneNode('Player').setPosition(RESET_POSITION.x, RESET_POSITION.y, RESET_POSITION.z);
    SceneNode.getSceneNode('Camera').setRotation(RESET_DIRECTION.pitch, RESET_DIRECTION.yaw);
    // SceneNode.getSceneNode('Map').reset();
  }

  _update() {
    if (this.stats) {
      this.stats.end();
      this.stats.begin();
    }
    if (SceneNode.getSceneNode('Player').getPosition().y < FALL_THRESHOLD) {
      this.resetPlayer();
    }
  }
}

export default Game;