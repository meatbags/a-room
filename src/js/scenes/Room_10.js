/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import Overworld from './Overworld';

class Room_10 extends Room {
  constructor() {
    super({
      name: 'Room_10',
      map: './models/rooms/room-10.fbx',
      collisionMap: './models/rooms/room-10-collision.fbx',
      position: new THREE.Vector3(0, 0, -Overworld.step),
    });
  }
}

export default Room_10;