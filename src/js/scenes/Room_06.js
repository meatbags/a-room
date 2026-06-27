/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_06 extends Room {
  constructor() {
    const r = 1.5625;
    const h1 = 1.5;
    const h2 = 5.7;
    const h3 = 9.9;
    const theta45 = Math.PI * 0.25;
    const theta225 = Math.PI * 1.25;
    const theta165 = Math.PI * 2 * (165/360);
    const theta285 = Math.PI * 2 * (285/360);

    super({
      name: 'Room_06',
      map: './models/rooms/room-06.fbx',
      collisionMap: './models/rooms/room-06-collision.fbx',
      position: new THREE.Vector3(-96, 0, 0),
      manifest: {
        circularControls: [
          [ [r, h1, 0], [1, 0, 0] ],
          [ [Math.cos(theta225) * r, h2, -Math.sin(theta225) * r], [Math.cos(theta225), 0, -Math.sin(theta225)] ],
          [ [Math.cos(theta45) * r, h2, -Math.sin(theta45) * r], [Math.cos(theta45), 0, -Math.sin(theta45)] ],
          [ [Math.cos(theta45) * r, h3, -Math.sin(theta45) * r], [Math.cos(theta45), 0, -Math.sin(theta45)] ],
          [ [Math.cos(theta165) * r, h3, -Math.sin(theta165) * r], [Math.cos(theta165), 0, -Math.sin(theta165)] ],
          [ [Math.cos(theta285) * r, h3, -Math.sin(theta285) * r], [Math.cos(theta285), 0, -Math.sin(theta285)] ]
        ]
      }
    });
  }
}

export default Room_06;