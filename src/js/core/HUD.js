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
    this._mapActive = false;
    this._mapRelative = true;
    this._mapScale =  {
      value: 1,
      target: 1,
      animateOut: 2.25,
      animateIn: 2.5,
      scrollable: {
        min: 1,
        max: 4,
        step: 0.125,
      },
    };
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
    window.addEventListener('wheel', e => {
      if (this._mapActive && e.deltaY) {
        // zoom in
        if (e.deltaY > 0) {
          this._mapScale.target = Math.max(this._mapScale.target - this._mapScale.scrollable.step, this._mapScale.scrollable.min);
        
        // zoom out
        } else {
          this._mapScale.target = Math.min(this._mapScale.target + this._mapScale.scrollable.step, this._mapScale.scrollable.max);
        }
      }
    });
    this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (document.querySelector('.engine__menu.active')) return;
        if (keyboard.isKeyDown('m')) {
          this._element.dataset.active = this._element.dataset.active == 1 ? 0 : 1;
          this._mapActive = this._element.dataset.active == 1;
          this._mapScale.target = this._mapActive ? this._mapScale.animateIn : this._mapScale.animateOut;
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
      // ...Overworld.manifest.platforms.platform, 
      ...Overworld.manifest.platforms.platform_circular,
    ].map(arr => arr[0]);

    // bridge positions
    this._refBridges = [
      ...Overworld.manifest.bridges.bridge
    ].map(arr => ({
      p: arr[0],
      size: { 
        x: arr[1] == 0 ? 3 : Overworld.step - 12,
        y: arr[1] == 0 ? Overworld.step - 12 : 3,
      },
    }));

    // pod positions
    this._refPods = [
      ...Overworld.manifest.bridges.pod
    ].map(arr => ({
      p: arr[0],
      offset: {
        x: Math.sin( arr[1] ),
        y: Math.cos( arr[1] )
      }
    }));
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
   * Util: world position to map coord.
   * 
   * @param {Vector3} position
   * @return {object}
   */
  _world2Map(position) {
    return {
      x: position.x * this._world2MapScale,
      y: position.z * this._world2MapScale
    };
  }

  /**
   * Util: trace octagon path.
   * 
   * @param {number} x
   * @param {number} y
   * @param {number} r
   */
  _octagon(x, y, r) {
    this._ctx.beginPath();
    for (let i=0; i<8; i++) {
      const theta = Math.PI / 4 * (i + 0.5);
      const x2 = x + r * Math.cos(theta);
      const y2 = y + r * Math.sin(theta);
      if (i == 0) {
        this._ctx.moveTo(x2, y2);
      } else {
        this._ctx.lineTo(x2, y2);
      }
    }
    this._ctx.closePath();
  }

  /**
   * Draw. Returns true if needs another draw.
   * 
   * @return {boolean}
   */
  _drawMap() {
    let needsUpdate = false;

    // unit helpers
    const u1 = 1 * this._world2MapScale;
    const u2 = 2 * this._world2MapScale;
    const u4 = 4 * this._world2MapScale;
    const u6 = 6 * this._world2MapScale;
    const u8 = 8 * this._world2MapScale;

    // clear
    this._ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._ctx.clearRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);

    // do player transform
    this._refCamera.getWorldDirection(this._cameraWorldDirection);
    const vec2 = new THREE.Vector2(this._cameraWorldDirection.x, this._cameraWorldDirection.z).normalize();
    const { x, y } = this._world2Map( this._refPlayer.getPosition() );
    if (this._mapRelative) {
      const rot = Math.atan2( - vec2.y, vec2.x ) - Math.PI / 2;
      this._ctx.translate( this._canvas.width / 2, this._canvas.height / 2 );
      this._ctx.scale( this._mapScale.value, this._mapScale.value );
      this._ctx.rotate( rot );
      this._ctx.translate( -x, -y );
    } else {
      this._ctx.translate(this._canvas.width / 2, this._canvas.height / 2);
    }

    // current room
    let currentLocation = null;
    const player = { x, y };

    // style
    this._ctx.lineWidth = 1;

    // draw platforms
    this._ctx.fillStyle = '#FFF';
    this._refPlatforms.forEach((p, i) => {
      const { x, y } = this._world2Map(p);
      this._ctx.fillRect(x - 1, y - 1, 2, 2);
    });

    // draw rooms
    this._refRooms.forEach(room => {
      this._ctx.strokeStyle = room.hasPower() ? '#FFF' : '#F00';
      const { x, y } = this._world2Map(room.position);
      this._octagon(x, y, u6);
      this._ctx.stroke();

      // check in room
      if (
        ! currentLocation && 
        (Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2)) < u6 * u6
      ) {
        currentLocation = room.name;
      }
    });

    // draw bridges
    this._ctx.strokeStyle = '#FFF';
    this._refBridges.forEach((bridge, i) => {
      const { x, y } = this._world2Map(bridge.p);
      const w = bridge.size.x * this._world2MapScale;
      const h = bridge.size.y * this._world2MapScale;
      this._ctx.strokeRect(x - w/2, y - h/2, w, h);

      // check in bridge
      if ( ! currentLocation && 
        Math.abs(player.x - x) < w/2 &&
        Math.abs(player.y - y) < h/2
      ) {
        currentLocation = `bridge ${i}`;
      }
    });

    // draw pods
    this._ctx.strokeStyle = '#FFF';
    this._refPods.forEach((pod, i) => {
      const { x, y } = this._world2Map(pod.p);
      this._ctx.beginPath();
      this._ctx.moveTo(x + pod.offset.x * u2, y + pod.offset.y * u2);
      this._ctx.lineTo(x + pod.offset.x * u4, y + pod.offset.y * u4);
      this._ctx.stroke();
      this._octagon(x + pod.offset.x * u8, y + pod.offset.y * u8, u4);
      this._ctx.stroke();

      // check in pod
      if (
        ! currentLocation && 
        Math.pow(player.x - (x + pod.offset.x * u8), 2) + 
          Math.pow(player.y - (y + pod.offset.y * u8), 2) < u6 * u6
      ) {
        currentLocation = `pod ${i}`;
      }
    });

    // draw player
    const size = u1 / 2;
    const cwx = vec2.x * this._world2MapScale;
    const cwy = vec2.y * this._world2MapScale;
    const px = x - cwx * size / 2;
    const py = y - cwy * size / 2;
    this._ctx.fillStyle = '#FFFFFF';
    this._ctx.beginPath();
    this._ctx.moveTo( px + cwx * size/4, py + cwy * size/4 );
    this._ctx.lineTo( px - cwy * size/2, py + cwx * size/2 );
    this._ctx.lineTo( px + cwx * size, py + cwy * size );
    this._ctx.lineTo( px + cwy * size/2, py - cwx * size/2 );
    this._ctx.closePath();
    this._ctx.fill();

    // draww
    if (currentLocation) {
      this._ctx.setTransform(1, 0, 0, 1, 0, 0);
      this._ctx.fillStyle = '#FFF';
      this._ctx.fillText('Location: ' + currentLocation, 10, 20);
    }

    return needsUpdate;
  }

  /**
   * Update.
   * 
   * @param {number} delta 
   */
  _update(delta) {
    if ( this._mapScale.value == this._mapScale.target && ( ! this._mapActive || ! this._needsUpdate ) ) {
      return;
    }
    this._mapScale.value += (this._mapScale.target - this._mapScale.value) * 0.1;
    if (Math.abs(this._mapScale.target - this._mapScale.value) < 0.001) {
      this._mapScale.value = this._mapScale.target;
    }
    this._needsUpdate = this._drawMap();
  }
}

export default HUD;