/** Interactive */

import { Hoverable, Prompt, MeshFromBoundingBox, SceneNode, Blend } from 'engine';
import * as THREE from 'three';

const INTERACT_KEY = 'e';

class Interactive extends SceneNode {
  static instance = 0;
  static EVENT_INTERACT = 'interact';

  constructor(object, props={}) {
    Interactive.instance ++;
    super({ name: props.name || `Interactive_${Interactive.instance}` });

    // refs
    this.object = object;
    this.conditionalCallback = props.conditional || null;
    this.promptText = props.prompt || 'Interact [E]';

    // props
    const radius = props.radius ?? 1.5;
    const normal = props.normal ?? null;

    // create mesh area + border
    const box = new THREE.Box3().setFromObject(object);
    if (props.border) {
      box.expandByScalar(props.border);
    }
    const mesh = MeshFromBoundingBox(box);
    mesh.visible = true;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    object.add(mesh);

    // prompt
    this.hoverable = new Hoverable(mesh, {
      name: this.name + '_Hoverable',
      radius: radius,
      normal: normal,
      onHover: () => {
        if (this.conditionalCallback && !this.conditionalCallback()) return;
        this.createPrompt(this.promptText, 'bottom');
      },
      onHoverEnd: () => {
        this.destroyPrompt();
      }
    });
    this.add(this.hoverable);

    // add callback
    if (props.callback) {
      this.addEventListener(Interactive.EVENT_INTERACT, props.callback);
    }

    // create key listener
    this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          keyboard.isKeyDown(INTERACT_KEY) &&
          this.hoverable.isHover() &&
          (this.conditionalCallback === null || this.conditionalCallback())
        ) {
          this.destroyPrompt();
          this.emit(Interactive.EVENT_INTERACT, this);
          if (this.timeout) {
            this.hoverable.disable();
            setTimeout(() => {
              this.hoverable.enable();
            }, this.timeout);
          }
        }
      });
  }

  /** disable */
  disable() {
    this.destroyPrompt();
    this.hoverable.disable();
  }

  /** enable */
  enable() {
    this.hoverable.enable();
  }

  /** create prompt */
  createPrompt(text, modifier='') {
    this.destroyPrompt();
    this._prompt = new Prompt({
      name: this.name + '_Prompt',
      text: text,
      modifier: modifier,
    });
    this.add(this._prompt);
  }

  /** destroy prompt */
  destroyPrompt() {
    if (this._prompt) {
      this._prompt.destroy();
      this._prompt = null;
    }
  }
}

export default Interactive;