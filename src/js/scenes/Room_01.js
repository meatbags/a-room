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
        sockets: [ [-2, 0.55, -2] ],
        doors: [ [[0, 4, -5], [2, 8, 0.25] ] ],
      }
    });
  }
  
  _init() {
    super._init();

    // mapped
    this._mapped = MapObjectByName( this.getAsset('map') );

    this._blocks = [];
    if (this._mapped.shard_01) CentrePivot( this._mapped.shard_01 );
    if (this._mapped.shard_02) CentrePivot( this._mapped.shard_02 );
    if (this._mapped.blocks) this._mapped.blocks.children.forEach(group => {
      const block = FindObject(group, obj => obj.name.indexOf('block') !== -1);
      // const wire = FindObject(group, obj => obj.name.indexOf('wire') !== -1);
      if (!block) return;
      CentrePivot(block);
      const age = Math.random() * 2 * Math.PI;
      const speed = 0.05 + Math.random() * 0.05;
      const offset = Math.random() * 0.1 + 0.1;
      const axis = Math.random() > 0.5 ? 'x' : 'z';
      const rotation = (Math.random() * 0.05 + 0.01) * Math.PI;
      const rotationSpeed = 0.01 + 0.05 * Math.random() * Math.PI;
      this._blocks.push({
        group, block, axis, age, speed, rotation, offset, rotationSpeed
      });
    });
  }

  _onStateChanged(changed) {
    const state = this.getState();
    if (state.power1) {
      this._map.Room_01_Door_1.open();
    } else {
      this._map.Room_01_Door_1.close();
    }
  }

  _update( delta ) {
    if (this._mapped.shard_01) this._mapped.shard_01.rotation.x += delta * 0.05;
    if (this._mapped.shard_02) this._mapped.shard_02.rotation.z += delta * 0.035;
    this._blocks.forEach(obj => {
      // group, block, wire, axis, age, speed, rotation, offset
      obj.age += delta;
      const theta1 = obj.age * obj.speed * Math.PI * 2;
      const theta2 = obj.age * obj.rotationSpeed * Math.PI * 2;
      obj.group.position.x = Math.sin( theta1 ) * obj.offset;
      obj.block.rotation[obj.axis] = Math.sin( theta2 ) * obj.rotation;
    });
  }
}

export default Room_01;