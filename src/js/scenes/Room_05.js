/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import SharedAssets from '../objects/SharedAssets';
import { CreateInstancedMeshes } from '../util/CreateInstancedMeshes';
import ExtractMeshes from '../util/ExtractMeshes';

class Room_05 extends Room {
  constructor() {
    const buttons = [];
    const step = 0.1875;
    const up = new THREE.Vector3(0, 1, 0);
    for (let y=0; y<4; y++) {
      for (let x=0; x<4; x++) {
        const p = new THREE.Vector3(
          ((x - 1.5) * -step),
          1.5 + ((y - 1.5) * -step),
          4.6875
        ).applyAxisAngle(up, Math.PI / 6);
        buttons.push([ p.x, p.y, p.z, 0.125 ]);
      }
    }

    super({
      name: 'Room_05',
      map: './models/rooms/room-05.fbx',
      collisionMap: './models/rooms/room-05-collision.fbx',
      position: new THREE.Vector3(-48, 0, 48),
      manifest: {
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ] // to airlock
        ],
        balls: [ [0, 0.25, 8] ],
        buttons
      },
    });
  }

  /** init */
  _init() {
    super._init();

    // create instanced mesh
    const n1 = 10000;
    const n2 = 50;
    const leafMesh = ExtractMeshes( SharedAssets.requestAsset('foliage_leaf') )[0];
    const instanced = CreateInstancedMeshes( leafMesh, n1 + n2, null, false )[0];
    instanced.position.copy(this._position);

    // place instances
    let stems = this.getAsset('map').getObjectByName('stems');
    let attr = stems.geometry.attributes;
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const helper = new THREE.Object3D();
    
    // leaves on stems
    for (let i=0; i<n1; i++) {
      const idx = Math.floor(Math.random() * attr.position.count) * 3;
      normal.set( attr.normal.array[idx], attr.normal.array[idx+1], attr.normal.array[idx+2] );
      const y = attr.position.array[idx+1];
      const offset = 0 + Math.random() * (0.2 + y / 20);
      position.set( 
        attr.position.array[idx] + normal.x * offset,
        y + normal.y * offset,
        attr.position.array[idx+2] + normal.z * offset
      );
      helper.position.copy( position );
      position.add( normal )
      helper.lookAt( position );
      helper.rotateOnAxis( normal, Math.random() * Math.PI * 2 );
      helper.scale.setScalar( 0.05 + Math.random() * 0.25 );
      helper.updateMatrix();
      instanced.setMatrixAt(i, helper.matrix);
    }

    // free floating leaves
    for (let i=0; i<n2; i++) {
      const theta = Math.PI * 2 * Math.random();
      const offset = Math.random() * 5;
      helper.position.set(Math.cos(theta) * offset, 4 + Math.random() * 11, Math.sin(theta) * offset);
      helper.rotation.set(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
      helper.scale.setScalar( 0.05 + Math.random() * 0.25 );
      helper.updateMatrix();
      instanced.setMatrixAt(n1 + i, helper.matrix);
    }

    // branches
    stems = this.getAsset('map').getObjectByName('stems2');
    attr = stems.geometry.attributes;
    const n3 = 1000;
    const branchMesh = ExtractMeshes( SharedAssets.requestAsset('foliage_branch') )[0];
    const instanced2 = CreateInstancedMeshes( branchMesh, n3, null, false )[0];
    instanced2.position.copy(this._position);

    // branches on stems
    for (let i=0; i<n1; i++) {
      const idx = Math.floor(Math.random() * attr.position.count) * 3;
      normal.set( attr.normal.array[idx], attr.normal.array[idx+1], attr.normal.array[idx+2] );
      const offset = 0 + Math.random() * 0.2;
      position.set( 
        attr.position.array[idx] + normal.x * offset,
        attr.position.array[idx+1] + normal.y * offset,
        attr.position.array[idx+2] + normal.z * offset
      );
      helper.position.copy( position );
      position.add( normal )
      helper.lookAt( position );
      helper.rotateOnAxis( normal, Math.random() * Math.PI * 2 );
      helper.scale.setScalar( 0.05 + Math.random() * 0.2 );
      helper.updateMatrix();
      instanced2.setMatrixAt(i, helper.matrix);
    }
    
    this._addToScene(instanced, instanced2);
  }

  _afterInit() {}

  /** on state changed */
  _onStateChanged( changed ) {
    const state = this.getState();

    // set buttons
    let total = 0;
    for (const key in state) {
      if (key.indexOf('button') !== -1) {
        total += state[key];
        const n = key.split('_')[1];
        this._map[`Room_05_Button_${n}`].setHex(state[key] ? 0x0000FF : 0);
      }
    }

    // set door
    this._map.Room_05_Door_1.setOpen(
      total === 7 && 
      state.button_3 &&
      state.button_5 &&
      state.button_6 &&
      state.button_7 &&
      state.button_8 &&
      state.button_11 &&
      state.button_13
    );
  }
}

export default Room_05;