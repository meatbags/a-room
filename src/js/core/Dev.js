/** Dev */

import { SceneNode } from 'engine';

class Dev extends SceneNode {
  constructor() {
    super({ name: 'Dev_Extended' });
  }

  _init() {
    this.settings = {
      wireframe: false,
    };

    window.addEventListener('keydown', e => {
      if (e.code === 'Digit1') {
        this.settings.wireframe = ! this.settings.wireframe;
        this._toggleWireframes();
      }
    });
  }

  _toggleWireframes() {
    SceneNode.getSceneNode('Scene').getScene().traverse(obj => {
      if (obj.material && obj.material.wireframe) {
        obj.visible = this.settings.wireframe;
        obj.material.depthWrite = false;
      }
    });
  }
}

export default Dev;