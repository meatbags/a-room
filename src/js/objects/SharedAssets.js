/** SharedAssets */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class SharedAssets extends SceneNode {
  static _instance = null;

  constructor(props={}) {
    super({ name: 'SharedAssets' });

    this.load('ball', './models/interactive/sphere.fbx');
    this.load('socket', './models/interactive/socket.fbx');
    this.load('terminal', './models/interactive/terminal.fbx');
    this.load('data_stick', './models/interactive/data_stick.fbx');

    SharedAssets._instance = this;
  }

  /** request asset */
  static requestAsset( name ) {
    const asset = SharedAssets._instance.getAsset(name);
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
    if (Array.isArray(material)) {
      return SharedAssets.deepCloneMaterialArray(material);
    }
    const clone = new ( material.constructor )();
    for (const key in material) {
      if (clone[key] !== undefined) {
        clone[key] = material[key];
      }
    }
    return clone;
  }

  /** material array */
  static deepCloneMaterialArray(materials) {
    const clone = materials.map(mat => SharedAssets.deepCloneMaterial(mat));
    return clone;
  }
}

export default SharedAssets;