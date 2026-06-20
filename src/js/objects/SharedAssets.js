/** SharedAssets */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class SharedAssets extends SceneNode {
  static _inst = null;

  constructor(props={}) {
    super({ name: 'SharedAssets' });

    this.load('ball', './models/interactive/sphere.fbx');
    this.load('terminal', './models/interactive/terminal.fbx');

    SharedAssets._inst = this;
  }

  /** request asset */
  static requestAsset( name ) {
    const asset = SharedAssets._inst.getAsset(name);
    if (!asset) {
      return null;
    }

    // clone asset & materials
    const clone = asset.clone();
    clone.traverse(child => {
      if (child.material) {
        child.material = SharedAssets.deepCloneMaterial(child.material);
      }
    });

    return clone;
  }

  /** deep clone material -- nb: forces rebuild */
  static deepCloneMaterial( material ) {
    const clone = new ( material.constructor )();
    for (const key in material) {
      if (clone[key] !== undefined) {
        clone[key] = material[key];
      }
    }
    return clone;
  }
}

export default SharedAssets;