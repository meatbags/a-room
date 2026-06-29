/** Ball */

import { SceneNode, Carryable, Prompt } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import SharedAssets from './SharedAssets';

class Ball extends SceneNode {
  static ATTACH_RADIUS = 2;
  static socketCache = null;
  
  constructor(props={}) {
    super({ name: props.name ?? 'Ball' });
    
    // props
    this.isBall = true;
    this._position = props.position || new THREE.Vector3();
    this._emissiveTarget = 0;
  }

  _init() {
    // set up dummy mesh
    this._mesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), 
      new THREE.MeshBasicMaterial({color:0x888888}));
    this._mesh.visible = false;
    this._mesh.position.copy(this._position);

    // register instanced
    this._instancedMeshIndex = SharedAssets.getInstancedMeshIndex('sphere');
    this._instancedMeshes = null;

    // build socket cache once
    if ( ! Ball.socketCache ) {
      Ball.rebuildSocketCache();
    }

    // make carryable
    this._carryable = new Carryable({
      mesh: this._mesh,
      onCarry: () => {
        Ball.socketCache.forEach(socket => {
          if (socket.hasAttached() && socket.attached.name === this.name) {
            this.detach(socket);
          }
        });
        this._carryable.carry();
      },
      onRelease: () => {
        // nearest valid socket
        const socket = Ball.nearestValidSocket(this._carryable.position);
        this._carryable.visualOffset.set(0, 0, 0);

        // attach or release
        if (socket) {
          this.attach( socket, false );
        } else {
          this._carryable.release();
        }
      }
    });
    
    // add
    this._addToScene(this._mesh);
    this.add(this._carryable);
  }

  /** attach to socket */
  attach(socket, warp=false) {
    socket.attach( this );
    this._carryable.attach( socket.position, null, true );
    if (warp) {
      this._carryable.warp( socket.position );
    }
    this._mesh.material.emissive = new THREE.Color(0xFFFFFF);
    this._emissiveTarget = 1;
  }

  /** detach */
  detach( socket ) {
    socket.detach();
    this._emissiveTarget = 0;
  }

  /** set position */
  _setInstancedPosition() {
    if (!this._instancedMeshes) {
      this._instancedMeshes = SharedAssets.getInstancedMesh('sphere');
    }
    this._mesh.updateMatrix();
    this._instancedMeshes.forEach(mesh => {
      mesh.setMatrixAt(this._instancedMeshIndex, this._mesh.matrix);
    });
  }

  /** update */
  _update() {
    // update carrying animation
    if (this._carryable.isCarrying) {
      const nearest = Ball.nearestValidSocket(this._carryable.position);
      if (nearest) {
        const prox = 1 - nearest.position.distanceTo(this._carryable.position) / Ball.ATTACH_RADIUS;
        const fwd = (0.001 + prox * 0.3) * Math.random();
        const side = (0.001 + prox * 0.025) * (Math.random() * 2 - 1);
        const dir = nearest.position.clone().sub(this._carryable.position).normalize();
        const cross = dir.clone().cross(new THREE.Vector3(0, 1, 0));
        this._carryable.visualOffset.set(
          dir.x * fwd + cross.x * side,
          dir.y * fwd + cross.y * side,
          dir.z * fwd + cross.z * side
        );
        if (!this._prompt) {
          this._createPrompt('[e] place', 'bottom');
        }
      } else {
        this._carryable.visualOffset.set(0, 0, 0);
        this._destroyPrompt();
      }
    } else {
      this._destroyPrompt();
    }

    // set visual
    this._setInstancedPosition();

    /** update emissive */
    /*
    if (this._mesh.material.emissiveIntensity !== this._emissiveTarget) {
      this._mesh.material.emissiveIntensity += (this._emissiveTarget - this._mesh.material.emissiveIntensity) * 0.05;
      if (Math.abs(this._emissiveTarget - this._mesh.material.emissiveIntensity) < 0.001) {
        this._mesh.material.emissiveIntensity = this._emissiveTarget;
      }
    }
    */
  }

  /** create prompt */
  _createPrompt(text, modifier='') {
    this._destroyPrompt();
    this._prompt = new Prompt({
      name: this.name + '_Prompt',
      text: text,
      modifier: modifier,
    });
    this.add(this._prompt);
  }

  /** destroy prompt */
  _destroyPrompt() {
    if (this._prompt) {
      this._prompt.destroy();
      this._prompt = null;
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

  /** util: get nearest valid socket */
  static nearestValidSocket(p) {
    let found = null;
    let d = -1;

    Ball.socketCache.forEach(socket => {
      if ( ! socket.hasAttached() ) {
        const dist = socket.position.distanceTo( p );
        if (dist <= Ball.ATTACH_RADIUS && (d === -1 || dist < d)) {
          found = socket;
          d = dist;
        }
      }
    });
    
    return found;
  }

  /** rebuild cache */
  static rebuildSocketCache() {
    Ball.socketCache = [];
    SceneNode.getSceneNode('Game').traverse(child => {
      if (child.isSocket) {
        Ball.socketCache.push(child);
      }
    });
  }
}

export default Ball;