/** SharedAssets */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import CreateInstancedMeshes from '../util/CreateInstancedMeshes';

class SharedAssets extends SceneNode {
  static _instance = null;
  static _instancedMeshes = {};

  constructor(props={}) {
    super({ name: 'SharedAssets' });

    this.load('sphere', './models/interactive/sphere.fbx');
    this.load('socket', './models/interactive/socket.fbx');
    this.load('terminal', './models/interactive/terminal.fbx');
    this.load('data_stick', './models/interactive/data_stick.fbx');

    SharedAssets._instance = this;
  }

  /** create instanced geometry */
  _afterInit() {
    for (const key in SharedAssets._instancedMeshes) {
      const asset = this.getAsset(key);
      const n = SharedAssets._instancedMeshes[key];
      const temp = [];
      for (let i=0; i<n; i++) {
        const p = new THREE.Vector3(i, 1, 0);
        const ry = 0;
        temp.push([p, ry]);
      }
      const meshes = CreateInstancedMeshes(asset, n, temp, true);
      meshes.forEach(mesh => this._addToScene(mesh));
      SharedAssets._instancedMeshes[key] = meshes;
    }
    console.log(SharedAssets._instancedMeshes);
  }

  /** request asset */
  static requestAsset( name ) {
    const asset = SharedAssets._instance.getAsset(name);
    if (!asset) {
      return null;
    }

    // clone asset & materials
    const clone = asset.clone();
    /*
    clone.traverse(child => {
      if (child.material) {
        child.material = SharedAssets.deepCloneMaterial(child.material);
      }
    });
    */

    return clone;
  }

  /** get instanced mesh index, increment setup counter */
  static getInstancedMeshIndex( name ) {
    if ( SharedAssets._instancedMeshes[name] == undefined ) {
      SharedAssets._instancedMeshes[name] = 0;
    }
    const index = SharedAssets._instancedMeshes[name];
    SharedAssets._instancedMeshes[name] += 1;
    return index;
  }

  /** get instanced mesh */
  static getInstancedMesh( name ) {
    return SharedAssets._instancedMeshes[name] ?? null;
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