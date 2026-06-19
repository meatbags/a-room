/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_03 extends Room {
  constructor() {
    const manifest = {
      balls: [
        [2.25, .25, .675],
      ],
      sockets: [],
      doors: [],
    };
    for (let i=0; i<8; i++) {
      const theta = Math.PI * 2 / 8 * i;
      const x = Math.cos(theta) * 1.25;
      const z = Math.sin(theta) * 1.25;
      manifest.sockets.push([
        x, 1, z
      ]);
    }

    super({
      name: 'Room_03',
      map: './models/rooms/room-03.fbx',
      collisionMap: './models/rooms/room-03-collision.fbx',
      position: new THREE.Vector3(0, 0, 0),
      manifest
    });
  }
}

export default Room_03;