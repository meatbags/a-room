/** Game */

import { SceneNode, Stats } from 'engine';
import * as THREE from 'three';
import Footsteps from '../audio/Footsteps';
import Music from '../audio/Music';
import SoundLibrary from '../audio/SoundLibrary';
import Map from '../scenes/Map';
import Lighting from './Lighting';
import Fog from '../scenes/Fog';
import SharedAssets from '../objects/SharedAssets';
import Frustum from '../util/Frustum';
import { optimisationMaterial } from '../util/CreateInstancedMeshes';

// scene
import Overworld from '../scenes/Overworld';
import Room_01 from '../scenes/Room_01';
import Room_02 from '../scenes/Room_02';
import Room_03 from '../scenes/Room_03';
import Room_04 from '../scenes/Room_04';
import Room_05 from '../scenes/Room_05';
import Room_06 from '../scenes/Room_06';
import Room_07 from '../scenes/Room_07';
import Room_08 from '../scenes/Room_08';
import Room_09 from '../scenes/Room_09';
import Room_10 from '../scenes/Room_10';
import Room_11 from '../scenes/Room_11';
import Room_12 from '../scenes/Room_12';
import Room_13 from '../scenes/Room_13';

const FALL_THRESHOLD = -32;
const RESET_POSITION = { x: 3.3125, y: 0.19, z: 92.725 };
const RESET_DIRECTION = { pitch: 0.06, yaw: 2.35 };

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
    //this.add( new Room_01() );
    //this.add( new Room_02() );
    //this.add( new Room_03() );
    this.add( new Room_04() );
    //this.add( new Room_05() );
    //this.add( new Room_06() );
    //this.add( new Room_07() );
    /*
    this.add( new Room_08() );
    this.add( new Room_09() );
    this.add( new Room_10() );
    this.add( new Room_11() );
    this.add( new Room_12() );
    this.add( new Room_13() );
    */

    // optimisation
    //this.add( new Frustum() );
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