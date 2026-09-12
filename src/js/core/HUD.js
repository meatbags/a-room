/** HUD */

import { SceneNode, Element } from 'engine';
import Overworld from '../scenes/Overworld';
import * as THREE from 'three';

class HUD extends SceneNode {
  /**
   * Constructor.
   */
  constructor() {
    super({ name: 'HUD' });

    // props
    this._needsUpdate = true;
  }

  /**
   * Initialise.
   */
  _init() {
    this._element = Element({
      class: 'Map',
      children: {
        class: 'Map__inner',
        children: [{
          class: 'Map__canvas',
          children: {
            type: 'canvas',
          },
        }, {
          class: 'Map__prompt',
          children: [{
            innerText: '[m]',
          }, {
            children: [{
              class: 'Map__prompt-open',
              innerText: 'open map',
            }, {
              class: 'Map__prompt-close',
              innerText: 'close'
            }]
          }]
        }]
      }
    });
    this._canvas = this._element.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');
    SceneNode.getSceneNode('Root').getOverlayElement().appendChild(this._element);

    // events
    window.addEventListener('resize', () => this.onResize());
    this.onResize();
    this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (keyboard.isKeyDown('m')) {
          this._element.dataset.active = this._element.dataset.active == 1 ? 0 : 1;
        }
      });
  }

  /**
   * After initialise.
   */
  _afterInit() {
    // player ref
    this._refPlayer = SceneNode.getSceneNode('Player');
    this._refPlayer.addEventListener('move', _ => {
      this._needsUpdate = true;
    });

    // camera ref
    this._refCamera = SceneNode.getSceneNode('Camera');
    this._refCamera.addEventListener('pan', _ => {
      this._needsUpdate = true;
    });
    this._cameraWorldDirection = new THREE.Vector3();

    // rooms ref
    this._refRooms = [];
    SceneNode.getSceneNode('LogicRoot').traverse(node => {
      if (node.isRoom) {
        this._refRooms.push(node);
        node.addEventListener('change', () => {
          this._needsUpdate = true;
        })
      }
    });

    // platforms position
    this._refPlatforms = [
      ...Overworld.manifest.platforms.platform, 
      ...Overworld.manifest.platforms.platform_circular,
    ].map(arr => arr[0]);
  }

  /**
   * Util: world position to map coord.
   * 
   * @param {Vector3} position
   * @return {object}
   */
  _world2Map(position) {
    return {
      x: this._canvas.width / 2 + position.x * this._world2MapScale,
      y: this._canvas.height / 2 + position.z * this._world2MapScale
    };
  }

  /**
   * Draw. Returns true if needs another draw.
   * 
   * @return {boolean}
   */
  _drawMap() {
    let needsUpdate = false;

    // clear
    this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);

    // draw platforms
    this._ctx.fillStyle = '#FFF';
    this._refPlatforms.forEach(p => {
      const { x, y } = this._world2Map(p);
      this._ctx.fillRect(x - 1, y - 1, 2, 2);
    });

    // draw rooms
    const r = 6 * this._world2MapScale;
    this._refRooms.forEach(room => {
      this._ctx.strokeStyle = room.hasPower() ? '#FFF' : '#F00';
      const { x, y } = this._world2Map(room.position);
      this._ctx.beginPath();
      for (let i=0; i<7; i++) {
        const theta = Math.PI / 4 * (i + 0.5);
        const x2 = x + r * Math.cos(theta);
        const y2 = y + r * Math.sin(theta);
        if (i=0) {
          this._ctx.moveTo(x2, y2);
        } else {
          this._ctx.lineTo(x2, y2);
        }
      }
      this._ctx.closePath();
      this._ctx.stroke();
    });

    // draw player
    this._refCamera.getWorldDirection(this._cameraWorldDirection);
    const vec2 = new THREE.Vector2(this._cameraWorldDirection.x, this._cameraWorldDirection.z).normalize();
    const { x, y } = this._world2Map( this._refPlayer.getPosition() );
    const size = 5;
    const cwx = vec2.x * this._world2MapScale;
    const cwy = vec2.y * this._world2MapScale;
    const px = x - cwx * size * 2/4;
    const py = y - cwy * size * 2/4;
    this._ctx.fillStyle = '#00FF00';
    this._ctx.beginPath();
    this._ctx.moveTo( px + cwx * size/4, py + cwy * size/4 );
    this._ctx.lineTo( px - cwy * size/2, py + cwx * size/2 );
    this._ctx.lineTo( px + cwx * size, py + cwy * size );
    this._ctx.lineTo( px + cwy * size/2, py - cwx * size/2 );
    this._ctx.closePath();
    this._ctx.fill();

    return needsUpdate;
  }

  /**
   * Resize handler.
   */
  onResize() {
    const rect = this._element.getBoundingClientRect();
    this._canvas.width = Math.max(100, rect.width);
    this._canvas.height = Math.max(100, rect.height);
    const padding = 80;
    const size = this._canvas.height - padding * 2;
    this._world2MapScale = size * (1 / (Overworld.step * 4));
    this._needsUpdate = true;
  }

  /**
   * Update.
   * 
   * @param {number} delta 
   */
  _update(delta) {
    if (!this._needsUpdate) return;
    this._needsUpdate = this._drawMap();
  }
}

export default HUD;