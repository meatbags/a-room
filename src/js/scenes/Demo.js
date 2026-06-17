/** Demo Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName } from 'engine';
import ExtractMeshes from '../util/ExtractMeshes';
import * as THREE from 'three';

import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Demo extends SceneNode {
  constructor() {
    super({ name: 'Demo' });

    this.load('room', './models/rooms/room-01.fbx');
    this.load('collision', './models/rooms/room-01-collision.fbx');

    this._position = new THREE.Vector3(0, 0, 96);
    this._active = true;

    this.createState({ power1: null, power2: null });
  }
  
  _init() {
    // test room
    const room = this.getAsset('room');
    ExtractMeshes( room ).forEach(mesh => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    room.position.copy( this._position );
    this._addToScene( room );

    // collision
    const collision = this.getAsset('collision');
    collision.position.copy( this._position );
    this._addObjectToPhysicsWorld( collision );
    this._addToScene( collision );

    // mapped
    this._mapped = MapObjectByName( room );
    if (this._mapped.shard_01) CentrePivot( this._mapped.shard_01 );
    if (this._mapped.shard_02) CentrePivot( this._mapped.shard_02 );
    
    // test ball
    const ball1 = new Ball({ position: new THREE.Vector3(-3, 0.25, -1.5).add(this._position) });
    const ball2 = new Ball({ position: new THREE.Vector3(-2, 0.25, 1.5).add(this._position) });
    this.add( ball1, ball2 );

    // test socket
    const socket1 = new Socket({ position: new THREE.Vector3(-2, 0.55, -2).add(this._position) });
    const socket2 = new Socket({ position: new THREE.Vector3(2, 0.55, -2).add(this._position) });
    socket1.addEventListener('attach', () => this.setState({ power1: 1 }));
    socket1.addEventListener('detach', () => this.setState({ power1: 0 }));
    socket2.addEventListener('attach', () => this.setState({ power2: 1 }));
    socket2.addEventListener('detach', () => this.setState({ power2: 0 }));
    this.add( socket1, socket2 );

    // door
    this._door = new Door({
      position: new THREE.Vector3(0, 4, -5).add( this._position ),
      size: new THREE.Vector3(2, 8, 0.25)
    });
    this.add( this._door );
  }

  _onStateChanged(changed) {
    const state = this.getState();
    if (state.power1 && state.power2) {
      this._door.open();
    } else {
      this._door.close();
    }
  }

  _update( delta ) {
    if (!this._active) return;
    if (this._mapped.shard_01) {
      this._mapped.shard_01.rotation.x += delta * 0.05;
    }
    if (this._mapped.shard_02) {
      this._mapped.shard_02.rotation.z += delta * 0.035;
    }
  }
}

export default Demo;