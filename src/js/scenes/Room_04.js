/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_04 extends Room {
  constructor() {
    const buttons = [];
    const dist = 3;
    const offset = Math.PI * 2 / 8;
    for (let i=0; i<8; i++) {
      const theta = offset * (i + 0.5);
      const x = Math.cos(theta) * dist;
      const z = Math.sin(theta) * dist;
      buttons.push([x, 0.125, z, 0.25]);
    }

    super({
      name: 'Room_04',
      map: './models/rooms/room-04.fbx',
      collisionMap: './models/rooms/room-04-collision.fbx',
      position: new THREE.Vector3(-48, 0, 0),
      manifest: {
        ladders: [ [ [-1.75, 4.25, 0], [1, 0, 0], [1.5, 8.5] ] ],
        doors: [
          [ [0, 4, 5], [2, 8, 0.25] ],
          [ [5, 4, 0], [0.25, 8, 2] ],
          [ [0, 4, -5], [2, 8, 0.25] ],
          [ [-5, 4, 0], [0.25, 8, 2] ],
        ],
        sockets: [ [0, .25, 0] ],
        balls: [ [1, 0.25, 0] ],
        buttons
      }
    });
  }

  _init() {
    super._init();

    // visual helper
    this._manifest.buttons.forEach((button, i) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(button[3], button[3], button[3]),
        new THREE.MeshPhysicalMaterial({
          emissive: 0x00FF00,
        }),
      );
      mesh.position.set(button[0], button[1], button[2]).add(this._position);
      const name = `button_${i+1}_mesh`;
      this._map[name] = mesh;
      this._addToScene(mesh);
    });
  }

  _afterInit() {
    this._map.Room_04_Ball_1.attach( this._map.Room_04_Socket_1, true );
  }

  /** on state changed */
  _onStateChanged() {
    const state = this.getState();
    const power = state.power_1;
    let total = 0;
    for (const key in state) {
      if (key.indexOf('button') !== -1) {
        total += state[key];
        this._map[`${key}_mesh`].material.emissiveIntensity = 
          power && state[key] ? 1 : 0;
      }
    }
    this._map.Room_04_Door_1.setOpen( power && total == 3 && state.button_3 && state.button_7 && state.button_8 );
    this._map.Room_04_Door_2.setOpen( power );
    this._map.Room_04_Door_3.setOpen( power && total == 3 && state.button_3 && state.button_4 && state.button_7 );
    this._map.Room_04_Door_4.setOpen( power && total == 3 && state.button_1 && state.button_2 && state.button_5 );
  }
}

export default Room_04;