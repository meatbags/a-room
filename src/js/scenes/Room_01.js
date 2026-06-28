/** Demo Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import FindObject from '../util/FindObject';

import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_01 extends Room {
  constructor() {
    super({
      name: 'Room_01',
      map: './models/rooms/room-01.fbx',
      mapLow: './models/rooms/room-01-low.fbx',
      collisionMap: './models/rooms/room-01-collision.fbx',
      position: new THREE.Vector3(0, 0, 96),
      manifest: {
        balls: [ [-3, 0.25, -1.5] ],
        sockets: [ [[0, 0.53125, 0], [0, 1, 0], Math.PI/6] ],
        doors: [ [[0, 2.125, -5.5], [0, 0, -1]] ],
      }
    });
  }
  
  _init() {
    super._init();

    // mapped
    this._mapped = MapObjectByName( this.getAsset('map') );

    // get shards
    if (this._mapped.shards) {
      this._mapped.shards.children.forEach(mesh => {
        CentrePivot( mesh );
        mesh.userData.axis = Math.random() > 0.5 ? 'x' : 'z';
        mesh.userData.speed = (Math.random() * 0.2 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
      });
    }
  }

  _afterInit() {}

  _onStateChanged(changed) {
    const state = this.getState();
    if (state.power_1) {
      this._map.Room_01_Door_1.open();
    } else {
      this._map.Room_01_Door_1.close();
    }
  }

  _update( delta ) {
    if (this._mapped.shards) {
      this._mapped.shards.children.forEach(mesh => {
        mesh.rotation[mesh.userData.axis] += delta * mesh.userData.speed;
      });
    }
  }
}

export default Room_01;