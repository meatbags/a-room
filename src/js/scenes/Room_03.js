/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_03 extends Room {
  constructor() {
    super({
      name: 'Room_03',
      map: './models/rooms/room-03.fbx',
      collisionMap: './models/rooms/room-03-collision.fbx',
      position: new THREE.Vector3(0, 0, 0),
      manifest: {
        balls: [
          [ 2.25, .25, .675 ],
          [ 0.5, 1.25, 21.5 ],
        ],
        sockets: [
          [[ 0, 1, 2.5 ], [0, 1, 1]],
          [[ 2.5, 1, 0 ], [1, 1, 0]],
          [[ 0, 1, -2.5 ], [0, 1, -1]],
          [[ -2.5, 1, 0 ], [-1, 1, 0]],
        ],
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ],
          [ [5.5, 2.125, 0], [-1, 0, 0] ],
          [ [0, 2.125, -5.5], [0, 0, -1] ],
          [ [-5.5, 2.125, 0], [-1, 0, 0] ],
        ],
      }
    });

    this._timer = 0;
    this._timeout = 0.35;
    this._index = 0;
    this._sequence = [];
  }

  _init() {
    super._init();

    // create map visualiser
    this._materialInactive = new THREE.MeshPhysicalMaterial({ color: 0x888888 });
    this._materialActive1 = new THREE.MeshPhysicalMaterial({ emissive: 0xFFFFFF, emissiveIntensity: 1 });
    this._materialActive2 = new THREE.MeshPhysicalMaterial({ emissive: 0xFFFF00, emissiveIntensity: 1 });
    this._materialActive3 = new THREE.MeshPhysicalMaterial({ emissive: 0xFF00FF, emissiveIntensity: 1 });
    this._materialActive4 = new THREE.MeshPhysicalMaterial({ emissive: 0x00FFFF, emissiveIntensity: 1 });
    const group = new THREE.Group();
    const positions = [
      [ 0, 0, -1 ],
      [ -0.5, 0, -0.5 ], [ 0, 0, -0.5 ], [ 0.5, 0, -0.5 ],
      [ -1, 0, 0 ], [ -0.5, 0, 0 ], [ 0, 0, 0 ], [ 0.5, 0, 0 ], [ 1, 0, 0 ],
      [ -0.5, 0, 0.5 ], [ 0, 0, 0.5 ], [ 0.5, 0, 0.5 ],
      [ 0, 0, 1 ]
    ];
    const g1 = [1, 3, 8];
    const g2 = [4, 2, 10, 12];
    const g3 = [5, 13, 9];
    const g4 = [11, 6, 7];
    positions.forEach((p, i) => {
      const n = i + 1;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(.0625, .0625, .0625), this._materialInactive);
      mesh.position.set(p[0], p[1], p[2]);
      if (g1.includes(n)) mesh.userData.material = this._materialActive1;
      else if (g2.includes(n)) mesh.userData.material = this._materialActive2;
      else if (g3.includes(n)) mesh.userData.material = this._materialActive3;
      else mesh.userData.material = this._materialActive4;
      group.add(mesh);
      this._map[`Indicator_${n}`] = mesh;
    });
    group.position.set(0, 0.75, 0).add(this._position);
    this._addToScene(group);
  }

  _afterInit() {
    // super._afterInit();
   
    // set initial attachment
    this._map.Room_03_Ball_1.attach( this._map.Room_03_Socket_2, true );
  }

  _onStateChanged(changed) {
    const state = this.getState();

    // set doors
    this._map.Room_03_Door_1.setOpen( state.power_1 == 1 );
    this._map.Room_03_Door_2.setOpen( state.power_2 == 1 );
    this._map.Room_03_Door_3.setOpen( state.power_3 == 1 );
    this._map.Room_03_Door_4.setOpen( state.power_4 == 1 );

    // reset sequence
    this._locked = true;
    this._sequence.forEach(mesh => {
      mesh.material = this._materialInactive;
    });
    this._sequence = [];
    if (state.power_1) {
      this._sequence.push(
        this._map.Indicator_1,
        this._map.Indicator_3,
        this._map.Indicator_8,
      );
    }
    if (state.power_3) {
      this._sequence.push(
        this._map.Indicator_4,
        this._map.Indicator_2,
        this._map.Indicator_10,
        this._map.Indicator_12,
      );
    }
    if (state.power_2) {
      this._sequence.push(
        this._map.Indicator_5,
        this._map.Indicator_13,
        this._map.Indicator_9,
      );
    }
    if (state.power_4) {
      this._sequence.push(
        this._map.Indicator_11,
        this._map.Indicator_6,
        this._map.Indicator_7,
      );
    }
    this._timer = 0;
    this._index = 0;
    this._locked = false;
  }
  
  /** update puzzle sequence */
  _update(delta) {
    if (!this._locked && this._sequence.length) {
      this._timer += delta;
      if (this._timer > this._timeout) {
        this._timer %= this._timeout;
        this._index = (this._index + 1) % this._sequence.length;
        this._sequence.forEach((mesh, i) => {
          mesh.material = i === this._index 
            ? mesh.userData.material : this._materialInactive;
        });
      }
    }
  }
}

export default Room_03;