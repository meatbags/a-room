/** LOD */

import { GetRoot, Clamp, Element } from 'engine';

class LOD {
  static loadingScreen = null;

  /**
   * Constructor.
   * 
   * @param {Vector3} position 
   */
  constructor(position, props={}) {
    this._position = position;
    this._objects = [];
    this._useLoadingScreen = props.useLoadingScreen ?? false;
    this._use2DRadius = props.use2DRadius ?? false;
    
    // create shared loading screen
    if (!LOD.loadingScreen) {
      LOD.loadingScreen = Element({ 
        class: 'LODLoadingScreen', 
        children: {
          innerHTML: 'Loading.',
        },
      });
      GetRoot().getOverlayElement().appendChild(LOD.loadingScreen);
    }

    // events
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
    }

    this._objects.push(item);
  }

  /**
   * Show loading screen.
   * 
   * @param {object} item
   */
  revealAfterLoadingScreen(item) {
    // lock item
    item.locked = true;
    
    // show loading screen
    LOD.loadingScreen.dataset.active = 1;

    // reveal object
    setTimeout(() => {
      item.object.visible = true;

      // unlock
      setTimeout(() => {
        item.loaded = true;
        item.locked = false;
  
        // hide loading screen
        setTimeout(() => {
          LOD.loadingScreen.dataset.active = 0;
        }, 100);
      }, 10);
    }, 10);
  }

  /**
   * Update LOD objects visibility.
   * 
   * @param {Vector3} position
   */
  setVisible(position) {
    const distSqr = this._use2DRadius
      ? Math.pow(this._position.x - position.x, 2) + Math.pow(this._position.z - position.z, 2)
      : this._position.distanceToSquared(position);

    // process LOD objects
    this._objects.forEach(item => {
      if ( item.locked ) {
        return;
      }
      if ( ! item.light ) {
        const visible = distSqr >= item.minSqr && distSqr < item.maxSqr;

        // deferred reveal
        if (this._useLoadingScreen && ! item.object.visible && ! item.loaded) {
          if (visible) {
            this.revealAfterLoadingScreen(item);
          } else {
            item.object.visible = false;
          }

        // reveal
        } else {
          item.object.visible = visible;
          item.loaded = item.loaded || visible;
        }
      } else {
        const t = 1 - Clamp((distSqr - item.light.fadeRadiusSqr) / item.light.fadeRadiusRange, 0, 1);
        item.object.intensity = t * item.light.intensity;
      }
    });
  }
}

export default LOD;