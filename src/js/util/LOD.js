/** LOD */

import { GetRoot, Clamp } from 'engine';

class LOD {

  /**
   * Constructor.
   * 
   * @param {Vector3} position 
   */
  constructor(position) {
    this._position = position;
    this._objects = [];
    GetRoot().getSceneNode('Camera').addEventListener('move', position => {
      this.setVisible(position);
    });
  }

  /**
   * Add object to LOD array.
   * 
   * @param {Object3D} object
   * @param {number} distanceMin
   * @param {number} distanceMax
   */
  add( object, distanceMin=0, distanceMax=1, lightFade=1 ) {
    const item = {
      object,
      min: distanceMin,
      max: distanceMax,
      minSqr: distanceMin * distanceMin,
      maxSqr: distanceMax * distanceMax,
    };

    // additional settings for lights
    if (object.isLight) {
      item.light = {};
      item.light.intensity = object.intensity;
      item.light.parent = object.parent;
      item.light.fadeRadiusSqr = Math.pow(distanceMax - lightFade, 2);
      item.light.fadeRadiusRange = item.maxSqr - item.light.fadeRadiusSqr;

      console.log(item);
    }

    this._objects.push(item);
  }

  /**
   * Update LOD objects visibility.
   * 
   * @param {Vector3} position
   */
  setVisible(position) {
    const distSqr = this._position.distanceToSquared(position);
    this._objects.forEach(item => {
      if ( ! item.light ) {
        item.object.visible = distSqr >= item.minSqr && distSqr < item.maxSqr;
      } else {
        const t = 1 - Clamp((distSqr - item.light.fadeRadiusSqr) / item.light.fadeRadiusRange, 0, 1);
        item.object.intensity = t * item.light.intensity;
      }
    });
  }
}

export default LOD;