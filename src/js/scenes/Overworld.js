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
  }

  /** override */
  _init() {
    // collision map
    const collision = this.getAsset('collision');    
    this._addObjectToPhysicsWorld(collision);
    this._addToScene(collision);

    // cosmetic background
    this._addToScene( this.getAsset('background') );

    // platform instanced
    let platform = null;
    this.getAsset('platform').traverse(child => {
      if (child.isMesh) {
        platform = child;
      }
    });
    const positions = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(64, 0, 0),
      new THREE.Vector3(0, 0, 64),
      new THREE.Vector3(-64, 0, 0),
      new THREE.Vector3(0, 0, -64),
      new THREE.Vector3(-64, 0, -64),
      new THREE.Vector3(64, 0, -64),
      new THREE.Vector3(64, 0, 64),
      new THREE.Vector3(-64, 0, 64),
      new THREE.Vector3(128, 0, 0),
      new THREE.Vector3(-128, 0, 0),
      new THREE.Vector3(0, 0, 128),
      new THREE.Vector3(0, 0, -128),
    ];
    const instanced = new THREE.InstancedMesh(platform.geometry, platform.material, positions.length);
    const helper = new THREE.Object3D();
    positions.forEach((p, i) => {
      helper.position.copy(p);
      helper.updateMatrix();
      instanced.setMatrixAt(i, helper.matrix);
    });
    this._addToScene(instanced);

    // bridge instanced
    let bridge = null;
    this.getAsset('bridge').traverse(child => {
      if (child.isMesh) {
        bridge = child;
      }
    });
    const halfPi = Math.PI / 2;
    const positionRotation = [
      [ new THREE.Vector3(32, 0, 0), halfPi ],
      [ new THREE.Vector3(96, 0, 0), halfPi ],
      [ new THREE.Vector3(-32, 0, 0), halfPi ],
      [ new THREE.Vector3(-96, 0, 0), halfPi ],
      [ new THREE.Vector3(0, 0, 32), 0 ],
      [ new THREE.Vector3(0, 0, -32), 0 ],
      [ new THREE.Vector3(0, 0, 96), 0 ],
      [ new THREE.Vector3(0, 0, -96), 0 ],
      [ new THREE.Vector3(-64, 0, 32), 0 ],
      [ new THREE.Vector3(64, 0, 32), 0 ],
      [ new THREE.Vector3(64, 0, -32), 0 ],
      [ new THREE.Vector3(32, 0, -64), halfPi ],
      [ new THREE.Vector3(-32, 0, -64), halfPi ],
    ];
    const instanced2 = new THREE.InstancedMesh(bridge.geometry, bridge.material, positionRotation.length);
    positionRotation.forEach((pr, i) => {
      helper.position.copy(pr[0]);
      helper.rotation.y = pr[1];
      helper.updateMatrix();
      instanced2.setMatrixAt(i, helper.matrix);
    });
    this._addToScene(instanced2);
  }
}

export default Overworld;