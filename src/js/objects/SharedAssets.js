/** SharedAssets */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import { CreateInstancedMeshes, optimisationInteractiveMaterial } from '../util/CreateInstancedMeshes';

class SharedAssets extends SceneNode {
  static _instance = null;
  static _instancedMeshes = {};

  constructor(props={}) {
    super({ name: 'SharedAssets' });

    this.load('sphere', './models/interactive/sphere.fbx');
    this.load('socket', './models/interactive/socket.fbx');
    this.load('terminal', './models/interactive/terminal.fbx');
    this.load('data_stick', './models/interactive/data_stick.fbx');
    this.load('door', './models/interactive/door.fbx');
    this.load('circular_control', './models/interactive/circular_control.fbx');
    this.load('circular_control_clue', './models/interactive/circular_control_clue.fbx');
    this.load('hexagonal_control', './models/interactive/hexagonal_control.fbx');
    this.load('hexagonal_control_clue', './models/interactive/hexagonal_control_clue.fbx');
    this.load('lidded_box', './models/interactive/lidded_box.fbx');
    this.load('foliage_leaf', './models/interactive/foliage_leaf.fbx');
    this.load('foliage_branch', './models/interactive/foliage_branch.fbx');

    SharedAssets._instance = this;
  }

  /** create instanced geometry */
  _afterInit() {
    for (const key in SharedAssets._instancedMeshes) {
      const asset = this.getAsset(key);
      const manifest = SharedAssets._instancedMeshes[key];
      const transforms = [];
      for (let i=0; i<manifest.count; i++) {
        const p = manifest.objects[i] ? manifest.objects[i].position : new THREE.Vector3(i, 1, 0);
        const r = manifest.objects[i] ? manifest.objects[i].rotation : new THREE.Euler(0, 0, 0);
        transforms.push([p, r]);
      }
      const meshes = CreateInstancedMeshes(asset, manifest.count, transforms, true);
      meshes.forEach(mesh => {
        mesh.material = optimisationInteractiveMaterial;
        this._addToScene(mesh);
       });
      SharedAssets._instancedMeshes[key].meshes = meshes;
    }
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
  static getInstancedMeshIndex( name, object3D=null ) {
    if ( SharedAssets._instancedMeshes[name] == undefined ) {
      SharedAssets._instancedMeshes[name] = { count: 0, meshes: [], objects: [] };
    }
    const index = SharedAssets._instancedMeshes[name].count;
    SharedAssets._instancedMeshes[name].count += 1;
    SharedAssets._instancedMeshes[name].objects.push( object3D );
    return index;
  }

  /** get instanced mesh/es */
  static getInstancedMesh( name ) {
    return SharedAssets._instancedMeshes[name] 
      ? SharedAssets._instancedMeshes[name].meshes : null;
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