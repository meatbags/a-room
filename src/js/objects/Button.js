/** Button */

import { SceneNode, Carryable, Hoverable, Prompt } from 'engine';
import * as THREE from 'three';
import ObjectBaseNode from './ObjectBaseNode';

class Button extends ObjectBaseNode {
  static materials = {};

  constructor(props={}) {
    super({ name: props.name ?? 'Button' });

    this.isButton = true;
    this._position = props.position ?? new THREE.Vector3();
    this._size = props.size ?? 0.125;
    this._enabled = true;
  }

  /** init */
  _init() {
    // visual
    if (!Button.materials.default) {
      Button.materials.default = new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF, 
        metalness: 0.05, 
        roughness: 0.95,
        emissive: 0x00FF00,
        emissiveIntensity: 0.05,
      });
      // create common colours
      [0xFF0000, 0x00FF00, 0x0000FF].forEach(hex => {
        Button.materials[hex] = new THREE.MeshPhysicalMaterial({
          color: 0xFFFFFF, 
          metalness: 0.05, 
          roughness: 0.95,
          emissive: hex,
          emissiveIntensity: 1,
        });
      });
    }
    this._mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this._size/2, 12, 12),
      Button.materials.default,
    );
    this._mesh.position.copy(this._position);
    this._addToScene(this._mesh);

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

  /** set button colour */
  setHex(hex) {
    if (hex === 0) {
      this._mesh.material = Button.materials.default;
    } else {
      if ( ! Button.materials[hex] ) {
        Button.materials[hex] = new THREE.MeshPhysicalMaterial({
          color: 0xFFFFFF, 
          metalness: 0.05, 
          roughness: 0.95,
          emissive: hex,
          emissiveIntensity: 1,
        });
      }
      this._mesh.material = Button.materials[hex];
    }
  }
}

export default Button;