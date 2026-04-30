/** Game */

import { SceneNode, Stats } from 'engine';
// import Stats from 'three/addons/libs/stats.module.js';
import Footsteps from '../audio/Footsteps';
import Music from '../audio/Music';
import SoundLibrary from '../audio/SoundLibrary';
import Map from '../scenes/Map';
import Lighting from './Lighting';

const FALL_THRESHOLD = -10;

class Game extends SceneNode {
  constructor() {
    super({ name: 'Game' });

    // sound
    this.add( new SoundLibrary() );
    this.add( new Footsteps() );
    this.add( new Music() );

    // environment
    this.add( new Lighting() );

    // scene
    this.add( new Map() );
  }

  _init() {
    this.resetPlayer();

    if (SceneNode.getSceneNode('Dev').isDev) {
      // add reset state hotkey
      SceneNode.getSceneNode('Dev').addFunction('Reset game state', '1', () => {
        this.traverse(child => {
          if (child.getState()) {
            child.setState(child.getInitialState());
          }
          if (typeof child.reset === 'function') {
            child.reset();
          }
        });
      });

      // FPS
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
      this.stats.dom.style.left = 'auto';
      this.stats.dom.style.right = '0px';
      this.stats.begin();
    }
  }

  resetPlayer() {
    SceneNode.getSceneNode('Player').setPosition(0, 0, 0);
    SceneNode.getSceneNode('Camera').setRotation(0, 0);
    SceneNode.getSceneNode('Map').reset();
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