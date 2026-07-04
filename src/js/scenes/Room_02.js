/** Demo Room */

import { SceneNode, Carryable, CentrePivot, SetPivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';

class Room_02 extends Room {
  constructor() {
    super({
      name: 'Room_02',
      position: new THREE.Vector3(0, 0, 48),
      manifest: {
        balls: [ [ -3.5, 0.25, 2.5 ], [ -3.5, 0.25, -2.5 ] ],
        sockets: [
          [[1.75, 1.25, 1.3125], [-1, 1, 0]],
          [[1.75, 1.25, 0], [-1, 1, 0]],
          [[1.75, 1.25, -1.3125], [-1, 1, 0]],
          [[-3, 0.53125, 0], [0, 1, 0]], 
        ],
        doors: [ [[0, 2.125, -5.5], [0, 0, -1] ] ],
        dataSticks: [ [[2.875, 1.25, 4.188], null ] ],
      },
    });

    // extend state
    this.createState({
      ...(this.getState() || {}),
      progression_1: 0,
      progression_2: 0,
    });
  }
  
  _init() {
    super._init();

    this._mapped = MapObjectByName( this._getCosmeticMap() );
    
    // indicator
    if (
      ! this._mapped.room_02_puzzle_rod_1 ||
      ! this._mapped.room_02_puzzle_rod_2
    ) {
      console.error('Asset not found:'. this._mapped );
      return;
    }

    SetPivot( this._mapped.room_02_puzzle_rod_1, new THREE.Vector3(2.8125, 1.75, 2.625) );
    SetPivot( this._mapped.room_02_puzzle_rod_2, new THREE.Vector3(2.8125, 1.75, -2.625) );
    this._target = { scale_1: 0.25, scale_2: 0.25 };
  }

  /** util: progression states */
  _getNextProgression( x, p1, p2, p3 ) {
    // 0 >= x > 1
    if (x < 1) {
      return p1 ? (p2 ? (p3 ? 3 : 2) : 1) : 0;
    // 1 >= x > 2
    } else if (x < 2) {
      return p2 ? (p3 ? 3 : 2) : (p1 ? 1 : 0);
    // 2 >= x > 3
    } else if (x < 3) {
      return p3 ? 3 : (p2 ? 2 : (p1 ? 1 : 0));
    // 3
    } else {
      return p3 ? 3 : (p2 ? 2 : (p1 ? 1 : 0));
    }
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();
    const door = this._map.Room_02_Door_1;
    
    // progression ladders
    let p1 = this._getNextProgression( state.progression_1, state.power_1, state.power_2, state.power_3 );
    let p2 = this._getNextProgression( state.progression_2, state.power_3, state.power_2, state.power_1 );
    while (p1 + p2 > 4) {
      p1 -= 0.5;
      p2 -= 0.5;
    }
    if (p1 !== state.progression_1 || p2 !== state.progression_2) {
      this.setState({ progression_1: p1, progression_2: p2 });
    }

    // set door
    door.setOpen( state.power_4 && p1 + p2 === 4 );

    // set visual
    this._target.scale_1 = Math.max(0.25, p1);
    this._target.scale_2 = Math.max(0.25, p2);
  }

  _update() {
    if (this._mapped.room_02_puzzle_rod_1 && this._mapped.room_02_puzzle_rod_2) {
      this._mapped.room_02_puzzle_rod_1.scale.z += 
        (this._target.scale_1 - this._mapped.room_02_puzzle_rod_1.scale.z) * 0.1;
      this._mapped.room_02_puzzle_conn_1.position.z = -this._mapped.room_02_puzzle_rod_1.scale.z * 1.3125;
      this._mapped.room_02_puzzle_rod_2.scale.z += 
        (this._target.scale_2 - this._mapped.room_02_puzzle_rod_2.scale.z) * 0.1;
      this._mapped.room_02_puzzle_conn_2.position.z = this._mapped.room_02_puzzle_rod_2.scale.z * 1.3125;
    }
  }
}

export default Room_02;