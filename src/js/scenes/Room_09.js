/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_09 extends Room {
  constructor() {
    super({
      name: 'Room_09',
      map: './models/rooms/room-09.fbx',
      collisionMap: './models/rooms/room-09-collision.fbx',
      position: new THREE.Vector3(48, 0, 48),
    });
  }
}

export default Room_09;