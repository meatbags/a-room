/** Overworld */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import { CreateInstancedMeshes } from '../util/CreateInstancedMeshes';
import Config from '../config/Config';
import SharedAssets from '../core/SharedAssets';

class Overworld extends SceneNode {
  constructor() {
    super({ name: 'Overworld' });

    // instance ref
    this._instances = {};
  }

  /** override */
  _init() {
    // cosmetic background
    const background = SharedAssets.requestAsset('background', false);
    ExtractMeshes( background ).forEach( mesh => {
      mesh.receiveShadow = true;
      mesh.castShadow = true;
    });
    this._addToScene( background );

    // create structure
    this.createModules();
    this.createPlatforms();
    this.createBridges();
    this.createAsteroidField();
  }

  /** create modules */
  createModules() {
    // create manifest
    const manifest = {};
    Object.keys(SharedAssets.getMap()).forEach(key => {
      if (key.indexOf('module') !== -1) {
        manifest[key] = [];
      }
    });

    // room 01
    manifest.module_circular_single.push( [ new THREE.Vector3(0, 0, 96), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 8, 96), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(0, 16, 96), 0 ] );

    // room 02
    manifest.module_semicircular.push( [ new THREE.Vector3(0, 0, 48), 0 ] );
    manifest.module_semicircular_roof.push( [ new THREE.Vector3(0, 8, 48), 0 ] );

    // room 03
    manifest.module_circular.push( [ new THREE.Vector3(0, 0, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 8, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(0, 16, 0), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(0, 24, 0), 0 ] );

    // room 04
    manifest.module_circular.push( [ new THREE.Vector3(-48, 0, 0), 0 ] );
    manifest.module_quarters.push( [ new THREE.Vector3(-48, 8, 0), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(-48, 16, 0), 0 ] );

    // room 05
    manifest.module_observatory.push( [ new THREE.Vector3(-48, 0, 48), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-48, 8, 48), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(-48, 16, 48), 0 ] );

    // room 06
    manifest.module_circular_single.push( [ new THREE.Vector3(-96, 0, 0), Math.PI * 1.5 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 8, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 16, 0), 0 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(-96, 24, 0), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(-96, 32, 0), 0 ] );

    // room 07
    manifest.module_circular.push( [ new THREE.Vector3(48, 0, 0), 0 ] );
    manifest.module_circular_single.push( [ new THREE.Vector3(48, 8, 0), Math.PI * 0.5 ] );
    manifest.module_circular_blank.push( [ new THREE.Vector3(48, 16, 0), 0 ] );
    manifest.module_circular_roof.push( [ new THREE.Vector3(48, 24, 0), 0 ] );

    // create modules
    for (const key in manifest) {
      if ( ! manifest[key].length ) continue;
      this._createInstancedMeshes( SharedAssets.requestAsset(`${key}_cosmetic`, true), manifest[key] );
      this._createCollisions( SharedAssets.requestAsset(`${key}_collision`, true), manifest[key] );
    }
  }

  /** create platforms */
  createPlatforms() {
    // world map
    //
    //           D
    //           |
    //       B - A - C
    //           |   |
    //   6 - 4 - 3 - 7 - 9
    //       |   |   |
    //       5   2   8
    //           |
    //           1

    const manifest = {
      platform_circular: [
        [ new THREE.Vector3(0, 0, 96), 0 ], // room 01 - cryo
        [ new THREE.Vector3(0, 0, 0), 0 ], // room 03 - hub
        [ new THREE.Vector3(-48, 0, 0), 0 ], // room 04 - quarters
        [ new THREE.Vector3(-96, 0, 0), 0 ], // room 06 - engineering
      ],
      platform: [
        [ new THREE.Vector3(0, 0, 48), 0 ], // room 02 - medical
        [ new THREE.Vector3(-48, 0, 48), 0 ], // room 05 - greenhouse
        [ new THREE.Vector3(48, 0, 0), 0 ], // room 07 - 
        [ new THREE.Vector3(48, 0, 48), 0 ], // room 08 - 
        [ new THREE.Vector3(96, 0, 0), 0 ], // room 09 - 
        [ new THREE.Vector3(0, 0, -48), 0 ], // room 10 - 
        [ new THREE.Vector3(-48, 0, -48), 0 ], // room 11 - 
        [ new THREE.Vector3(48, 0, -48), 0 ], // room 12 - observatory
        [ new THREE.Vector3(0, 0, -96), 0 ], // room 13 - command
      ]
    };

    // create instanced meshes, collisions
    for (const key in manifest) {
      const transforms = manifest[key];
      this._createInstancedMeshes( SharedAssets.requestAsset(`${key}_cosmetic`, false), transforms );
      this._createCollisions( SharedAssets.requestAsset(`${key}_collision`, false), transforms );
    }
  }

  /** create bridges */
  createBridges() {
    // manifest
    const halfPi = Math.PI / 2;
    const rand = (a, b) => a + Math.floor(Math.random()*(b-a+1));
    const manifest = {
      bridge: [
        [ new THREE.Vector3(72, 0, 0), halfPi],
        [ new THREE.Vector3(-72, 0, 0), halfPi],
        [ new THREE.Vector3(0, 0, 72), 0],
        [ new THREE.Vector3(0, 0, -72), 0],
        [ new THREE.Vector3(-48, 0, 24), 0],
        [ new THREE.Vector3(48, 0, 24), 0],
        [ new THREE.Vector3(48, 0, -24), 0],
        [ new THREE.Vector3(24, 0, -48), halfPi],
        [ new THREE.Vector3(-24, 0, -48), halfPi]
      ],
      bridge_large: [
        [ new THREE.Vector3(24, 0, 0), halfPi],
        [ new THREE.Vector3(-24, 0, 0), halfPi * 3],
        [ new THREE.Vector3(0, 0, 24), 0],
        [ new THREE.Vector3(0, 0, -24), Math.PI],
      ]
    };

    // create instanced meshes, collisions
    for (const key in manifest) {
      const transforms = manifest[key];
      this._createInstancedMeshes( SharedAssets.requestAsset(`${key}_cosmetic`, false), transforms );
      this._createCollisions( SharedAssets.requestAsset(`${key}_collision`, false), transforms );
    }
  }

  /** create asteroid field */
  createAsteroidField() {
    // instanced
    const n = 600;
    const mesh = ExtractMeshes( SharedAssets.requestAsset('asteroid', false) )[0];
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