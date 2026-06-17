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
      new THREE.SphereGeometry(0.5, 32, 32), 
      new THREE.MeshPhysicalMaterial({
        color:0xFF0000,
        opacity:1,
        transmission: 1,
        thicknessMap: new THREE.TextureLoader().load('./images/Concrete_Base_02/Concrete_Base_02_Base_Color.jpg'),
				metalness: 0,
				roughness: 0,
        ior: 1.25,
				thickness: 1,
        attenuationColor: 0xffffff,
				attenuationDistance: 1,
				specularIntensity: 1,
				specularColor: 0xff0000,
        side: THREE.BackSide,
      }));
    mesh.position.copy(this._position);
    this._addToScene(mesh);

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
    if (json.attached) {
      SceneNode.getSceneNode('Game').traverse(child => {
        if (child.isBall && child.carryable.name === json.attached) {
          child.attach(this, true);
        }
      });
    }
  }
}

export default Socket;