/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

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
          4.25
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
      total === 6 && 
      state.button_3 &&
      state.button_5 &&
      state.button_6 &&
      state.button_7 &&
      state.button_8 &&
      state.button_11
    );
  }
}

export default Room_05;