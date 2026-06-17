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
        sockets: [ [-2.5, .5, -3], [2, 1, -4.5], [2, 1.75, -4.5] ],
        doors: [ [[0, 4, -5], [2, 8, 0.25] ] ],
      },
    });

    this.createState({
      ...(this.getState() || {}),
      progression: 0,
    })
  }
  
  _init() {
    super._init();

    // indicator
    this._indicator = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
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
        if (state.power2) this.setState({ progression: 1 });
        door.close();
        break;
      case 1: 
        if (state.power3) this.setState({ progression: 2 });
        else if ( !state.power2 ) this.setState({ progression: 0 });
        door.close();
        break;
      case 2:
        if (state.power3 && state.power1) {
          door.open();
        } else {
          if (!state.power3) this.setState({ progression: 0 });
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