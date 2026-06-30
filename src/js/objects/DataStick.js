/** DataStick */

import { SceneNode, Animation, Hoverable } from 'engine';
import * as THREE from 'three';
import SharedAssets from './SharedAssets';
import ExtractMeshes from '../util/ExtractMeshes';
import ObjectBaseNode from './ObjectBaseNode';

class DataStick extends ObjectBaseNode {
  static modifierPrompt = 'data-stick-prompt';
  static modifierMessage = 'data-stick-message';

  constructor(props={}) {
    super({ name: props.name ?? 'DataStick' });

    // props
    this.isDataStick = true;
    this._position = props.position ?? new THREE.Vector3();
    this._rotation = new THREE.Euler(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
    this._axis = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize();
    this._rotationSpeed = Math.PI * 0.02;
    this._text = props.text ?? '[ text ]';
  }

  /** init */
  _init() {
    // dummy mesh
    this._object3D = new THREE.Object3D();
    this._object3D.position.copy(this._position);
    this._object3D.rotation.copy(this._rotation);

    // register instanced
    this._instancedMeshIndex = SharedAssets.getInstancedMeshIndex('data_stick');
    this._instancedMeshes = null;

    // hoverable
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2), 
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    box.visible = false;
    box.position.copy(this._position);
    this._hoverable = new Hoverable(box, {
      onHover: () => {
        if ( ! this._canInteract() ) return;
        this._createPrompt('[e] read', DataStick.modifierPrompt);
      },
      onHoverEnd: () => {
        if ( ! this._canInteract() ) return;
        this._destroyPrompt();
      },
    });
    this._addToScene(box);
    this.add(this._hoverable);

    // keyboard
    const listener = this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          ! this._canInteract() || 
          ! this._hoverable.isHover() ||
          ! keyboard.isKeyDown('e')
        ) return;
        this._displayMessage();
      });
  }

  /** display message */
  _displayMessage() {
    this._locked = true;
    this._destroyPrompt();
    this._hoverable.disable();
    this._createPrompt(this._text, DataStick.modifierMessage);
    const element = this._prompt.element;
    setTimeout(() => {
      this._destroyPrompt();
      setTimeout(() => {
        this._locked = false;
        this._hoverable.enable();
      }, 250);  
    }, 1000);
  }

  /** set position */
  _setInstancedPosition() {
    if (!this._instancedMeshes) {
      this._instancedMeshes = SharedAssets.getInstancedMesh('data_stick');
    }
    this._object3D.updateMatrix();
    this._instancedMeshes.forEach(mesh => {
      mesh.setMatrixAt(this._instancedMeshIndex, this._object3D.matrix);
    });
  }

  /** update */
  _update(delta) {
    this._object3D.rotateOnAxis(this._axis, this._rotationSpeed * delta);
    this._setInstancedPosition();
  }
}

export default DataStick;