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
          [[ 0, 1, 1.25 ], [0, 1, 0]],
          [[ 1.25, 1, 0 ], [0, 1, 0]],
          [[ 0, 1, -1.25 ], [0, 1, 0]],
          [[ -1.25, 1, 0 ], [0, 1, 0]],
        ],
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ],
          [ [5.5, 2.125, 0], [-1, 0, 0] ],
          [ [0, 2.125, -5.5], [0, 0, -1] ],
          [ [-5.5, 2.125, 0], [-1, 0, 0] ],
        ],
      }
    });
  }

  _init() {
    super._init();
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
  }  
}

export default Room_03;