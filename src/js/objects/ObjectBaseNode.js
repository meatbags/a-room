/** ObjectBaseNode */

import { SceneNode, Carryable, Prompt } from 'engine';
import * as THREE from 'three';

class ObjectBaseNode extends SceneNode {
  static cameraRef = null;
  static broadphaseRadius = 4;
  static broadphaseRadiusSquared = 16;

  constructor(props={}) {
    super(props);

    // props
    this.isObjectBaseNode = true;
    this._enabled = true;
    this._locked = false;
    this._position = props.position ?? new THREE.Vector3();
    this._hoverable = null;
  }

  /** create prompt */
  _createPrompt(text, modifier='') {
    this._destroyPrompt();
    this._prompt = new Prompt({
      name: this.name + '_Prompt',
      text: text,
      modifier: modifier,
    });
    this.add(this._prompt);
  }

  /** destroy prompt */
  _destroyPrompt() {
    if (this._prompt) {
      this._prompt.destroy();
      this._prompt = null;
    }
  }

  /** set enabled */
  set enabled(value) {
    // set value
    this._enabled = value;

    // update prompt, hoverable
    if ( ! this._enabled ) {
      this._destroyPrompt();
      if (this._hoverable) {
        this._hoverable.disable();
      }
    } else {
      if (this._hoverable) {
        this._hoverable.enable();
      }
    }
  }

  /** set locked */
  set locked(value) {
    // set value
    this._locked = value;
  }

  /** check can interact */
  _canInteract(position=null) {
    if ( ! ObjectBaseNode.cameraRef ) {
      ObjectBaseNode.cameraRef = SceneNode.getSceneNode('Camera').getCamera();
    }
    return this._enabled && 
      ! this._locked && 
      ! Carryable.currentTarget && 
      (position || this._position).distanceToSquared( ObjectBaseNode.cameraRef.position ) 
          <= ObjectBaseNode.broadphaseRadiusSquared;
  }
}

export default ObjectBaseNode;