/** Overworld */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class Overworld extends SceneNode {
  constructor() {
    super({ name: 'Overworld' });

    this.load('background', './models/overworld/background.fbx');
    this.load('collision', './models/overworld/collision.fbx');
    this.load('platform', './models/overworld/platform.fbx');
    this.load('bridge', './models/overworld/bridge.fbx');
    this.load('pylon', './models/overworld/pylon.fbx');

    // instance ref
    this._instances = {};
  }

  /** override */
  _init() {
    // collision map
    const collision = this.getAsset('collision');    
    this._addObjectToPhysicsWorld(collision);
    this._addToScene(collision);

    // cosmetic background
    // this._addToScene( this.getAsset('background') );

    // bridge instanced
    this.createPlatforms();
    this.createBridges();
  }

  /** create platforms */
  createPlatforms() {
    // manifest
    const transforms = [
      [ new THREE.Vector3(0, 0, 0), 0 ], 
      [ new THREE.Vector3(64, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, 64), 0 ], 
      [ new THREE.Vector3(-64, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, -64), 0 ], 
      [ new THREE.Vector3(-64, 0, -64), 0 ], 
      [ new THREE.Vector3(64, 0, -64), 0 ], 
      [ new THREE.Vector3(64, 0, 64), 0 ], 
      [ new THREE.Vector3(-64, 0, 64), 0 ], 
      [ new THREE.Vector3(128, 0, 0), 0 ], 
      [ new THREE.Vector3(-128, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, 128), 0 ], 
      [ new THREE.Vector3(0, 0, -128), 0 ],
    ];

    // create platforms
    this._createInstancedMeshes(this.getAsset('platform'), transforms);   
  }

  /** create bridges */
  createBridges() {
    // manifest
    const halfPi = Math.PI / 2;
    const rand = (a, b) => a + Math.floor(Math.random()*(b-a+1));
    const transforms = [
      [ new THREE.Vector3(32, 0, 0), halfPi],
      [ new THREE.Vector3(96, 0, 0), halfPi],
      [ new THREE.Vector3(-32, 0, 0), halfPi],
      [ new THREE.Vector3(-96, 0, 0), halfPi],
      [ new THREE.Vector3(0, 0, 32), 0],
      [ new THREE.Vector3(0, 0, -32), 0],
      [ new THREE.Vector3(0, 0, 96), 0],
      [ new THREE.Vector3(0, 0, -96), 0],
      [ new THREE.Vector3(-64, 0, 32), 0],
      [ new THREE.Vector3(64, 0, 32), 0],
      [ new THREE.Vector3(64, 0, -32), 0],
      [ new THREE.Vector3(32, 0, -64), halfPi],
      [ new THREE.Vector3(-32, 0, -64), halfPi]
    ];

    // create bridge
    this._createInstancedMeshes(this.getAsset('bridge'), transforms);   
  }

  /** create instanced meshes */
  _createInstancedMeshes(group, transforms) {
    // create instanced meshes
    const instanced = {};
    group.traverse(child => {
      if (child.isMesh) {
        const mesh = new THREE.InstancedMesh(
          child.geometry, child.material, transforms.length);
        mesh.castShadow = true;
        mesh.receiveShadow = true; 
        instanced[child.name] = mesh;
        this._addToScene(mesh);
      }
    });

    // apply transforms
    const _tmp = new THREE.Object3D();
    transforms.forEach((t, i) => {
      // set transform
      _tmp.position.copy(t[0]);
      _tmp.rotation.y = t[1];
      _tmp.updateMatrix();
      
      // set matrix
      for (const key in instanced) {
        instanced[key].setMatrixAt(i, _tmp.matrix);
      }
    });
  }
}

export default Overworld;