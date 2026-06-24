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
        sockets: [ [[-1.5625, 0.3125, -2.0938], [0, 1, 0]] ],
        doors: [ [[0, 2.125, -5.5], [0, 0, -1]] ],
      }
    });
  }
  
  _init() {
    super._init();

    // mapped
    this._mapped = MapObjectByName( this.getAsset('map') );

    // get shards
    this._blocks = [];
    if (this._mapped.shard_01) CentrePivot( this._mapped.shard_01 );
    if (this._mapped.shard_02) CentrePivot( this._mapped.shard_02 );
  }

  _onStateChanged(changed) {
    const state = this.getState();
    if (state.power_1) {
      this._map.Room_01_Door_1.open();
    } else {
      this._map.Room_01_Door_1.close();
    }
  }

  _update( delta ) {
    if (this._mapped.shard_01) this._mapped.shard_01.rotation.x += delta * 0.05;
    if (this._mapped.shard_02) this._mapped.shard_02.rotation.z += delta * 0.035;
  }
}

export default Room_01;