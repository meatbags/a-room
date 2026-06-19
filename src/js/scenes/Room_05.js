/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_05 extends Room {
  constructor() {
    super({
      name: 'Room_05',
      map: './models/rooms/room-05.fbx',
      collisionMap: './models/rooms/room-05-collision.fbx',
      position: new THREE.Vector3(-96, 0, 0),
    });
  }
}

export default Room_05;