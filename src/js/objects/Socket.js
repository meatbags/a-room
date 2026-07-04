/** Socket */

import { SceneNode, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Ball from './Ball';
import SharedAssets from '../core/SharedAssets';

class Socket extends SceneNode {
  constructor(props={}) {
    super({ name: props.name ?? 'Socket' });
    
    // props
    this.isSocket = true;
    this._position = props.position || new THREE.Vector3();
    this._orientation = props.orientation || new THREE.Vector3(0, 1, 0);
    this._rotation = props.rotation || 0;
    this._attached = null;

    // state
    this.createState({ attached: null });
  }

  _init() {
    // set instanced mesh index
    const object = new THREE.Object3D();
    object.lookAt(this._orientation);
    if (this._rotation) {
      // object.rotateOnAxis(this._orientation, this._rotation);
    }
    object.position.copy(this._position);
    const index = SharedAssets.getInstancedMeshIndex( 'socket', object );

    // ensure available
    Ball.rebuildSocketCache();
  }

  /** attach object */
  attach(object) {
    this._attached = object;
    this.setState({ attached: object.name });
    this.emit('attach');
  }

  /** detach object */
  detach() {
    this._attached = null;
    this.setState({ attached: null });
    this.emit('detach');
  }

  /** has attached */
  hasAttached() {
    return this._attached !== null;
  }

  /** get position */
  get position() {
    return this._position;
  }

  /** get attached object */
  get attached() {
    return this._attached;
  }

  /** get attached ball */
  fromJSON(json) {
    // detach existing
    if (this.hasAttached()) {
      this._attached.detach( this );
    }

    // attach existing
    if (json.attached) {
      const sockets = [];
      let ball = null;
      SceneNode.getSceneNode('Game').traverse(child => {
        if (child.isSocket) {
          sockets.push(child);
        }
        if (child.isBall && child.name === json.attached) {
          ball = child;
        }
      });
      if (ball) {
        sockets.forEach(socket => {
          if (
            socket.name !== this.name && 
            socket.hasAttached() && 
            socket.attached.name === ball.name
          ) {
            ball.detach( socket );
          }
        });
        ball.attach(this, true);
      }
    }

    // set state
    this.setState({ attached: json.attached ?? null });
  }
}

export default Socket;