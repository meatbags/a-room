/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import SharedAssets from '../objects/SharedAssets';

class Room_07 extends Room {
  constructor() {
    super({
      name: 'Room_07',
      map: './models/rooms/room-07.fbx',
      collisionMap: './models/rooms/room-07-collision.fbx',
      position: new THREE.Vector3(48, 0, 0),
      manifest: {
        airlocks: [
          [[-6.5, 8, 0], [-1, 0, 0], [1, 2, 7, 8]]
        ],
      }
    });
  }

  _init() {
    super._init();

    // add gate
    const gate = SharedAssets.requestAsset('gate_large');
    const orientation = new THREE.Vector3(1, 0, 0);
    gate.lookAt( orientation );
    gate.position.set(-21, 0, 0).add(this._position);
    this._addToScene(gate);
  }
}

export default Room_07;