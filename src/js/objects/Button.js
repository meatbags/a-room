/** Button */

import { SceneNode, Carryable, Hoverable, Prompt } from 'engine';
import * as THREE from 'three';

class Button extends SceneNode {
  constructor(props={}) {
    super({ name: props.name ?? 'Button' });

    this.isButton = true;
    this._position = props.position ?? new THREE.Vector3();
    this._size = props.size ?? 0.125;
  }

  _init() {
    // hoverable
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(this._size, this._size, this._size), 
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    );
    box.visible = false;
    box.position.copy(this._position);
    this._hoverable = new Hoverable(box, {
      name: `${this.name}_Hoverable`,
      radius: 2,
      onHover: () => {
        if ( ! this._canInteract() ) return;
        this._createPrompt('[e] press', 'button');
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
        this._press();
      });
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

  /** on press */
  _press() {
    if (this._locked) return;
    this._locked = true;
    this._destroyPrompt();
    this._hoverable.disable();
    this.emit('press');
    setTimeout(() => {
      this._locked = false;
      this._hoverable.enable();
    }, 200);
  }

  /** check can interact */
  _canInteract() {
    return ! this._locked && ! Carryable.currentTarget;
  }
}

export default Button;