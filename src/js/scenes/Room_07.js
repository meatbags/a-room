/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_07 extends Room {
  constructor() {
    super({
      name: 'Room_07',
      map: './models/rooms/room-07.fbx',
      collisionMap: './models/rooms/room-07-collision.fbx',
      position: new THREE.Vector3(48, 0, 0),
    });
  }
}

export default Room_07;