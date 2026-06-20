/** DataStick */

import { SceneNode, Animation, Hoverable, Carryable, Prompt } from 'engine';
import * as THREE from 'three';
import SharedAssets from './SharedAssets';
import ExtractMeshes from '../util/ExtractMeshes';

class DataStick extends SceneNode {
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
    // add asset
    const asset = SharedAssets.requestAsset('data_stick');
    this._group = new THREE.Group();
    ExtractMeshes( asset ).forEach(mesh => {
      mesh.castShadow = true;
      this._group.add(mesh);
    });
    this._group.position.copy(this._position);
    this._group.rotation.copy(this._rotation);
    this._addToScene(this._group);
    console.log(this._group);

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
      })
  }

  /** create prompt */
  _createPrompt(text, modifier) {
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

  /** check can interact */
  _canInteract() {
    return ! this._locked && ! Carryable.currentTarget;
  }

  /** update */
  _update(delta) {
    this._group.rotateOnAxis(this._axis, this._rotationSpeed*delta);
  }
}

export default DataStick;