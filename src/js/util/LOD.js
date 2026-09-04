/** LOD */

import { GetRoot } from 'engine';

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
  add( object, distanceMin=0, distanceMax=1 ) {
    this._objects.push({
      object,
      min: distanceMin,
      max: distanceMax,
      minSqr: distanceMin * distanceMin,
      maxSqr: distanceMax * distanceMax,
    });
  }

  /**
   * Update LOD objects visibility.
   * 
   * @param {Vector3} position
   */
  setVisible(position) {
    const distSqr = this._position.distanceToSquared(position);
    this._objects.forEach(item => {
      item.object.visible = distSqr >= item.minSqr && distSqr < item.maxSqr;
    });
  }
}

export default LOD;