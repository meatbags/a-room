/** Overworld */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import { CreateInstancedMeshes } from '../util/CreateInstancedMeshes';
import Config from '../config/Config';

class Overworld extends SceneNode {
  constructor() {
    super({ name: 'Overworld' });

    // load assets
    this._assetList = [
      'background',
      'platform',
      'platform_tapered',
      'bridge_alt',
      'bridge_large_alt',
      'module_airlock',
      'module_circular',
      'module_circular_single',
      'module_circular_blank',
      'module_triangular',
      'module_square',
      'module_roof_circular',
      'module_roof_triangular',
      'module_roof_square',
      'module_observation',
      'platform_collision',
      'platform_tapered_collision',
      'bridge_alt_collision',
      'bridge_large_alt_collision',
      'module_airlock_collision',
      'module_circular_collision',
      'module_circular_single_collision',
      'module_circular_blank_collision',
      'module_triangular_collision',
      'module_square_collision',
      'module_roof_circular_collision',
      'module_roof_triangular_collision',
      'module_roof_square_collision',
      'module_observation_collision',
      'pylon',
      'rock'
    ];
    this._assetList.forEach(key => {
      this.load(key, `./models/overworld/${key}.fbx`);
    })

    // instance ref
    this._instances = {};
  }

  /** override */
  _init() {
    // cosmetic background
    const background = this.getAsset('background');
    ExtractMeshes( background ).forEach( mesh => {
      mesh.receiveShadow = true;
      mesh.castShadow = true;
    });
    this._addToScene( background );

    // bridge instanced
    this.createModules();
    this.createPlatforms();
    this.createBridges();
    this.createAsteroidField();
  }

  /** create modules */
  createModules() {
    // manifest
    const manifest = {};
    this._assetList.forEach(key => manifest[key] = []);

    // room 01
    manifest.module_circular_single.push( [ new THREE.Vector3(0, 0, 96), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 8, 96), 0 ] );
    manifest.module_roof_circular.push( [ new THREE.Vector3(0, 16, 96), 0 ] );

    // room 02
    manifest.module_triangular.push( [ new THREE.Vector3(0, 0, 48), 0 ] );
    manifest.module_roof_triangular.push( [ new THREE.Vector3(0, 8, 48), 0 ] );

    // room 03
    manifest.module_circular.push( [ new THREE.Vector3(0, 0, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 8, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 16, 0), 0 ] );
    manifest.module_roof_circular.push( [ new THREE.Vector3(0, 24, 0), 0 ] );

    // room 04
    manifest.module_circular.push( [ new THREE.Vector3(-48, 0, 0), 0 ] );
    manifest.module_square.push( [ new THREE.Vector3(-48, 8, 0), 0 ] );
    manifest.module_roof_square.push( [ new THREE.Vector3(-48, 16, 0), 0 ] );

    // room 05
    manifest.module_observation.push( [ new THREE.Vector3(-48, 0, 48), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-48, 8, 48), 0 ] );
    manifest.module_roof_circular.push( [ new THREE.Vector3(-48, 16, 48), 0 ] );
    manifest.module_airlock.push( [ new THREE.Vector3(-48, 0, 48), Math.PI ] );

    // room 06
    manifest.module_circular_single.push( [ new THREE.Vector3(-96, 0, 0), Math.PI * 1.5 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 8, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 16, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 24, 0), 0 ] );
    manifest.module_roof_circular.push( [ new THREE.Vector3(-96, 32, 0), 0 ] );

    // room 07
    manifest.module_circular.push( [ new THREE.Vector3(48, 0, 0), 0 ] );
    manifest.module_circular_single.push( [ new THREE.Vector3(48, 8, 0), Math.PI * 0.5 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(48, 16, 0), 0 ] );
    manifest.module_roof_circular.push( [ new THREE.Vector3(48, 24, 0), 0 ] );

    // create modules
    for (const key in manifest) {
      if ( ! manifest[key].length ) continue;
      this._createInstancedMeshes(this.getAsset(key), manifest[key]);
      this._createCollisions(this.getAsset(`${key}_collision`), manifest[key]);
    }
  }

  /** create platforms */
  createPlatforms() {
    // map
    //           D
    //           |
    //       B - A - C
    //           |   |
    //   6 - 4 - 3 - 7 - 9
    //       |   |   |
    //       5   2   8
    //           |
    //           1

    const transforms1 = [
      [ new THREE.Vector3(0, 0, 96), 0 ], // room 01 - cryo
      [ new THREE.Vector3(0, 0, 0), 0 ], // room 03 - hub
      [ new THREE.Vector3(-48, 0, 0), 0 ], // room 04 - quarters
      [ new THREE.Vector3(-96, 0, 0), 0 ], // room 06 - engineering
    ];
    const transforms2 = [
      [ new THREE.Vector3(0, 0, 48), 0 ], // room 02 - medical
      [ new THREE.Vector3(-48, 0, 48), 0 ], // room 05 - greenhouse
      [ new THREE.Vector3(48, 0, 0), 0 ], // room 07 - 
      [ new THREE.Vector3(48, 0, 48), 0 ], // room 08 - 
      [ new THREE.Vector3(96, 0, 0), 0 ], // room 09 - 
      [ new THREE.Vector3(0, 0, -48), 0 ], // room 10 - 
      [ new THREE.Vector3(-48, 0, -48), 0 ], // room 11 - 
      [ new THREE.Vector3(48, 0, -48), 0 ], // room 12 - observatory
      [ new THREE.Vector3(0, 0, -96), 0 ], // room 13 - command
    ];

    // create platforms
    this._createInstancedMeshes(this.getAsset('platform_tapered'), transforms1);
    this._createCollisions(this.getAsset('platform_tapered_collision'), transforms1);
    this._createInstancedMeshes(this.getAsset('platform'), transforms2);
    this._createCollisions(this.getAsset('platform_collision'), transforms2);
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
    this._createInstancedMeshes(this.getAsset('bridge_alt'), transforms);
    this._createInstancedMeshes(this.getAsset('bridge_large_alt'), transforms2);
    this._createCollisions(this.getAsset('bridge_alt_collision'), transforms);
    this._createCollisions(this.getAsset('bridge_large_alt_collision'), transforms2);
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

  /** util: create instanced meshes */
  _createInstancedMeshes(group, transforms, shadows=true) {
    CreateInstancedMeshes(group, transforms.length, transforms, shadows)
      .forEach(mesh => {
        this._addToScene(mesh);
      });
  }

  /** util: create collisions */
  _createCollisions(group, transforms) {
    transforms.forEach(t => {
      const collision = group.clone();
      collision.position.copy(t[0]);
      if (t.length > 1 && t[1] !== 0) {
        ExtractMeshes(collision).forEach(mesh => {
          mesh.geometry = mesh.geometry.clone();
          mesh.geometry.rotateY( t[1] );
        });
      }
      this._addObjectToPhysicsWorld(collision);
      this._addToScene(collision);
    });
  }

  _update(delta) {
    if (this._distantBackground) {
      this._distantBackground.rotation.y += 
        delta * Config.Graphics.backgroundRotation * 0.1;
    }
  }
}

export default Overworld;