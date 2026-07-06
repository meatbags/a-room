/** SharedAssets */

import { SceneNode, MapObjectByName } from 'engine';
import * as THREE from 'three';
import { CreateInstancedMeshes, optimisationInteractiveMaterial } from '../util/CreateInstancedMeshes';

class SharedAssets extends SceneNode {
  static _instance = null;
  static _instancedMeshes = {};
  static _map = null;
  static _emissiveMaterials = {};

  constructor(props={}) {
    super({ name: 'SharedAssets' });

    // load assets
    this.load('objects_group', './models/objects_group.fbx');
    this.load('rooms_group', './models/rooms_group.fbx');
    this.load('modules_group', './models/modules_group.fbx');
    this.load('structures_group', './models/structures_group.fbx');

    SharedAssets._instance = this;
  }

  /** create instanced geometry */
  _afterInit() {
    SharedAssets.map();
    
    // create instanced
    for (const key in SharedAssets._instancedMeshes) {
      const asset = SharedAssets._map[key];
      if ( ! asset ) {
        console.warn( 'Could not create instanced mesh, asset not found:', key );
        continue;
      }
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

  /** util: map object */
  static map() {
    if ( ! SharedAssets._map ) {
      SharedAssets._map = {
        ...MapObjectByName( this._instance.getAsset('objects_group') ),
        ...MapObjectByName( this._instance.getAsset('rooms_group') ),
        ...MapObjectByName( this._instance.getAsset('modules_group') ),
        ...MapObjectByName( this._instance.getAsset('structures_group') ),
      };
    }
  }

  /** get map */
  static getMap() {
    SharedAssets.map();
    return SharedAssets._map;
  }

  /** request asset */
  static requestAsset( name, clone=true ) {
    // map assets
    SharedAssets.map();

    // check exists
    if ( ! SharedAssets._map[name] ) {
      console.warn('Asset not found:', name);
      return null;
    }

    // clone
    if (clone) {
      return SharedAssets._map[name].clone();
    } else {
      return SharedAssets._map[name];
    }
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

  /** util: get shared emissive material */
  static getEmissiveMaterial(hex) {
    if ( ! SharedAssets._emissiveMaterials[hex] ) {
      SharedAssets._emissiveMaterials[hex] = new THREE.MeshPhysicalMaterial({
        emissive: hex,
        emissiveIntensity: 1,
      });
    }
    return SharedAssets._emissiveMaterials[hex];
  }
}

export default SharedAssets;