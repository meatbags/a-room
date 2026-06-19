/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_04 extends Room {
  constructor() {
    super({
      name: 'Room_04',
      map: './models/rooms/room-04.fbx',
      collisionMap: './models/rooms/room-04-collision.fbx',
      position: new THREE.Vector3(-48, 0, 0),
    });
  }
}

export default Room_04;