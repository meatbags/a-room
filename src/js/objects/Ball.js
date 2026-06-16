/** Ball */

import { SceneNode, Carryable } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';

class Ball extends SceneNode {
  static ATTACH_RADIUS = 2;
  
  constructor(props={}) {
    super({ name: props.name ?? 'Ball' });
    
    // props
    this.isBall = true;
    this._object = props.object;
    this._position = props.position || new THREE.Vector3();
  }

  _init() {
    // set up mesh
    this._mesh = ExtractMeshes( this._object )[0];
    this._mesh.position.copy(this._position);
    this._mesh.castShadow = true;

    // make carryable
    this._carryable = new Carryable({ 
      mesh: this._mesh,
      onCarry: () => {
        SceneNode.getSceneNode('Game').traverse(child => {
          if (
            child.isSocket && 
            child.hasAttached() &&
            child.attached.id === this._carryable.id
          ) {
            child.detach();
          }
        });
        this._carryable.carry();
      },
      onRelease: () => {
        // get nearest valid socket
        let found = false;
        let d = -1;

        SceneNode.getSceneNode('Game').traverse(child => {
          if ( child.isSocket && ! child.hasAttached() ) {
            const dist = child.position.distanceTo(this._mesh.position);
            if (dist <= Ball.ATTACH_RADIUS && (d === -1 || dist < d)) {
              found = child;
              d = dist;
            }
          }
        });

        // attach or release
        if (found) {
          this.attach( found, false );
        } else {
          this._carryable.release();
        }
      }
    });
    
    this._addToScene(this._mesh);
    this.add(this._carryable);
  }

  /** attach to socket */
  attach(socket, warp=false) {
    socket.attach( this._carryable );
    this._carryable.attach( socket.position, null, true );
    if (warp) {
      this._carryable.warp( socket.position );
    }
  }

  /** get carryable */
  get carryable() {
    return this._carryable;
  }

  /** get json */
  toJSON() {
    return {
      position: [
        this._mesh.position.x,
        this._mesh.position.y,
        this._mesh.position.z
      ]
    };
  }

  /** set from json */
  fromJSON(json) {
    this._carryable.warp(
      new THREE.Vector3(
        json.position[0],
        json.position[1],
        json.position[2]
      )
    );
  }
}

export default Ball;