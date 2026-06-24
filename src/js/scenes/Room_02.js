/** Demo Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import FindObject from '../util/FindObject';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_02 extends Room {
  constructor() {
    super({
      name: 'Room_02',
      map: './models/rooms/room-02.fbx',
      collisionMap: './models/rooms/room-02-collision.fbx',
      position: new THREE.Vector3(0, 0, 48),
      manifest: {
        balls: [ [3.5, 1.5, 0], [ -3.5, 0.25, 2.5 ] ],
        sockets: [ 
          [[-2.5, .3125, -3], [0, 1, 0]], 
          [[2, 1, -4.25], [0, 0, 1]], 
          [[2, 1.75, -4.25], [0, 0, 1]]
        ],
        doors: [ [[0, 2.125, -5.5], [0, 0, -1] ] ],
        dataSticks: [ [[3, 1.25, 3], '[ lore snippet ]'] ],
      },
    });

    // extend state
    this.createState({
      ...(this.getState() || {}),
      progression: 0,
    })
  }
  
  _init() {
    super._init();

    // indicator
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.125, 0.125, 0.125),
      new THREE.MeshBasicMaterial({color:0xFF0000})
    );
    light.position.set(1.25, 1.75, -4.5).add(this._position);
    this._addToScene(light);
    this._indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 2.25, 0.5),
      new THREE.MeshBasicMaterial({ color:0xFF0000 })
    );
    this._indicator.geometry.translate(0, -1, 0);
    this._indicator.position.set(1.25, 0.25, -4.5).add(this._position);
    this._indicatorTarget = this._indicator.position.y;
    this._addToScene(this._indicator);
  }

  _onStateChanged(changed) {
    const state = this.getState();
    const door = this._map.Room_02_Door_1;
    
    // progression ladder
    switch (state.progression) {
      case 0: 
        if (state.power_2) this.setState({ progression: 1 });
        door.close();
        break;
      case 1: 
        if (state.power_3) this.setState({ progression: 2 });
        else if ( !state.power_2 ) this.setState({ progression: 0 });
        door.close();
        break;
      case 2:
        if (state.power_3 && state.power_1) {
          door.open();
        } else {
          if (!state.power_3) this.setState({ progression: 0 });
          door.close();
        } 
        break;
      default: break;
    }

    // test visual
    this._indicatorTarget = state.progression == 0 ? 0.25 : 
      state.progression == 1 ? 1 : 1.75;
  }

  _update() {
    this._indicator.position.y += (this._indicatorTarget - this._indicator.position.y) * 0.2;
  }
}

export default Room_02;