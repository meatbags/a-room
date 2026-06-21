/** Overworld */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import Config from '../config/Config';

class Overworld extends SceneNode {
  constructor() {
    super({ name: 'Overworld' });

    this.load('background', './models/overworld/background.fbx');
    this.load('collision', './models/overworld/collision.fbx');
    this.load('platform', './models/overworld/platform.fbx');
    this.load('bridge', './models/overworld/bridge_alt.fbx');
    this.load('bridge_covered', './models/overworld/bridge_covered.fbx');
    this.load('pylon', './models/overworld/pylon.fbx');
    this.load('rock', './models/overworld/rock.fbx');

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
    const background = this.getAsset('background');
    ExtractMeshes( background ).forEach( mesh => {
      mesh.receiveShadow = true;
      mesh.castShadow = true;
    });
    this._addToScene( background );


    // bridge instanced
    this.createPlatforms();
    this.createBridges();
    this.createAsteroidField();
  }

  /** create platforms */
  createPlatforms() {
    // manifest
    const transforms = [
      [ new THREE.Vector3(0, 0, 0), 0 ], 
      [ new THREE.Vector3(48, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, 48), 0 ], 
      [ new THREE.Vector3(-48, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, -48), 0 ], 
      [ new THREE.Vector3(-48, 0, -48), 0 ], 
      [ new THREE.Vector3(48, 0, -48), 0 ], 
      [ new THREE.Vector3(48, 0, 48), 0 ], 
      [ new THREE.Vector3(-48, 0, 48), 0 ], 
      [ new THREE.Vector3(96, 0, 0), 0 ], 
      [ new THREE.Vector3(-96, 0, 0), 0 ], 
      [ new THREE.Vector3(0, 0, 96), 0 ], 
      [ new THREE.Vector3(0, 0, -96), 0 ],
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
      [ new THREE.Vector3(72, 0, 0), halfPi],
      [ new THREE.Vector3(-72, 0, 0), halfPi],
      [ new THREE.Vector3(0, 0, 72), 0],
      [ new THREE.Vector3(0, 0, -72), 0],
      [ new THREE.Vector3(-48, 0, 24), 0],
      [ new THREE.Vector3(48, 0, 24), 0],
      [ new THREE.Vector3(48, 0, -24), 0],
      [ new THREE.Vector3(24, 0, -48), halfPi],
      [ new THREE.Vector3(-24, 0, -48), halfPi]
    ];
    const transforms2 = [
      [ new THREE.Vector3(24, 0, 0), halfPi],
      [ new THREE.Vector3(-24, 0, 0), halfPi * 3],
      [ new THREE.Vector3(0, 0, 24), 0],
      [ new THREE.Vector3(0, 0, -24), Math.PI],
    ];

    // create bridges
    this._createInstancedMeshes(this.getAsset('bridge'), transforms);
    this._createInstancedMeshes(this.getAsset('bridge_covered'), transforms2);
  }

  /** create asteroid field */
  createAsteroidField() {
    // instanced
    const n = 600;
    const mesh = ExtractMeshes(this.getAsset('rock'))[0];
    const instanced = new THREE.InstancedMesh(
      mesh.geometry, mesh.material, n
    );

    // transforms
    const _tmp = new THREE.Object3D();
    const range = (a, b) => a + Math.random() * (b - a);
    for (let i=0; i<n; i++) {
      const distance = range(200, 2500);
      const scale = range(0.1, 20);
      _tmp.position.copy(
        new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize().multiplyScalar( distance )
      );
      _tmp.scale.setScalar(scale);
      _tmp.rotation.set(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI
      );
      _tmp.updateMatrix();
      
      // set matrix
      instanced.setMatrixAt(i, _tmp.matrix);
    }

    // add to scene
    this._distantBackground = new THREE.Group();
    this._distantBackground.add(instanced);
    this._addToScene(this._distantBackground);
  }

  /** create instanced meshes */
  _createInstancedMeshes(group, transforms, shadows=true) {
    // create instanced meshes
    const instanced = {};
    group.traverse(child => {
      if (child.isMesh) {
        const mesh = new THREE.InstancedMesh(
          child.geometry, child.material, transforms.length);
        if (shadows) {
          mesh.castShadow = true;
          mesh.receiveShadow = true; 
        }
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

  _update(delta) {
    this._distantBackground.rotation.y += 
      delta * Config.Graphics.backgroundRotation * 0.1;
  }
}

export default Overworld;