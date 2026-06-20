/** Socket */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import Ball from './Ball';

class Socket extends SceneNode {
  constructor(props={}) {
    super({ name: props.name ?? 'Socket' });
    
    // props
    this.isSocket = true;
    this._position = props.position || new THREE.Vector3();
    this._attached = null;

    // state
    this.createState({ attached: null });
  }

  _init() {
    // helper
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.375, 32, 32), 
      new THREE.MeshPhysicalMaterial({
        color:0xFF0000,
        transparent: true,
        opacity: 0.5,
        emissive: 0xFF0000,
        emissiveIntensity: 0.25,
				metalness: 0,
				roughness: 0,
        ior: 1.25,
				thickness: 1,
        attenuationColor: 0xffffff,
				attenuationDistance: 1,
				specularIntensity: 1,
				specularColor: 0xff0000,
        side: THREE.FrontSide,
      }));
    mesh.position.copy(this._position);
    this._mesh = mesh;
    this._addToScene(mesh);

    // ensure available
    Ball.rebuildSocketCache();
  }

  /** attach object */
  attach(object) {
    this._attached = object;
    this._mesh.material.side = THREE.BackSide;
    this.setState({ attached: object.name });
    this.emit('attach');
  }

  /** detach object */
  detach() {
    this._attached = null;
    this._mesh.material.side = THREE.FrontSide;
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