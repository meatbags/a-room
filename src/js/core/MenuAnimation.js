/** MenuAnimation */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class MenuAnimation extends SceneNode {
  constructor() {
    super({ name: 'MenuAnimation' });
    this._active = false;
    this._age = 0;
    this._phase = Math.PI * 0.25;
    this._rotationSpeed = 0.0008;
    this._distance = 400;
    this._y = -50;
    this._ready = false;
    this._origin = new THREE.Vector3();
  }

  /** set ready */
  set ready(value) {
    this._ready = value;
  }

  /** reset defaults, destroy */
  _resetDestroy() {
    this._destroying = true;

    // destroy
    this.destroy();
  }

  _setup() {
    // destroy if in-game
    if ( ! this._getModule('MainLoop').isPaused() ) {
      this.destroy();

    // get targets
    } else {
      this._refRenderer = SceneNode.getSceneNode('Renderer');
      this._refCamera = SceneNode.getSceneNode('Camera').getCamera();

      // add destroy event
      const ui = this._getModule('UserInterface');
      this._addEventListenerToObject(ui, 'pointerlockchange', controls => {
        if (controls.isLocked()) {
          this._resetDestroy();
        }
      });

      // activate
      this._active = true;
    }
  }

  /** update */
  _update(delta) {
    if ( this._destroying ) return;
    if ( ! this._active ) {
      this._setup();
    }
    if (this._active) {
      if ( ! this._ready ) {
        this._refCamera.position.set(
          (Math.random() * 2 - 1) * 96,
          Math.random() * 24,
          (Math.random() * 2 - 1) * 96,
        );
      } else {
        this._age += delta;
        const theta = this._age * this._rotationSpeed * Math.PI * 2 + this._phase;
        const x = Math.cos( theta ) * this._distance;
        const z = Math.sin( theta ) * this._distance;
        this._refCamera.position.set(x, this._y, z);
      }
      this._refCamera.lookAt(this._origin);
      this._refRenderer.render(delta);
    }
  }
}

export default MenuAnimation;