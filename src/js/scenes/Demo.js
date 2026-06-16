/** Demo Room */

import { SceneNode, Carryable, CentrePivot, Door, MapObjectByName } from 'engine';
import ExtractMeshes from '../util/ExtractMeshes';
import * as THREE from 'three';

import Ball from '../objects/Ball';
import Socket from '../objects/Socket';

class Demo extends SceneNode {
  constructor() {
    super({ name: 'Demo' });

    this.load('ball', './models/interactive/sphere.fbx');

    this.createState({ power: null });
  }
  
  _init() {
    // test ball
    this.add( new Ball({ 
      object: this.getAsset('ball'),
      position: new THREE.Vector3(-3, 0.25, -4.5)
    }) );

    // test socket
    const socket = new Socket({ position: new THREE.Vector3(-3, 0.5, -6) });
    socket.addEventListener('attach', () => this.setState({ power: 1 }));
    socket.addEventListener('detach', () => this.setState({ power: 0 }));
    this.add( socket );
  }

  _onStateChanged(changed) {
    // console.log( this.getState() );
  }
}

export default Demo;