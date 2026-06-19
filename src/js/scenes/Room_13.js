/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_13 extends Room {
  constructor() {
    super({
      name: 'Room_13',
      map: './models/rooms/room-13.fbx',
      collisionMap: './models/rooms/room-13-collision.fbx',
      position: new THREE.Vector3(0, 0, -96),
    });
  }
}

export default Room_13;