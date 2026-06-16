/** Socket */

import { SceneNode } from 'engine';
import * as THREE from 'three';

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
      new THREE.BoxGeometry(1, 1, 1), 
      new THREE.MeshBasicMaterial({color:0xFF0000, transparent:true, opacity:0.85}));
    mesh.position.copy(this._position);
    this._addToScene(mesh);
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