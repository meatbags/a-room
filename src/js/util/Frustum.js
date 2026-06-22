/** Frustum */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class Frustum extends SceneNode {
  static MANHATTAN_DISTANCE_THRESHOLD = 5;

  constructor(props={}) {
    super({ name: props.name ?? 'Frustum' });
  }

  _afterInit() {
    /*
    this._objects = [];

    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const maxSize = 6;

    SceneNode.getSceneNode('Scene').getScene().traverse(object => {
      if (object.isMesh && object.material && ! object.material.wireframe) {
        box.setFromObject( object, false );
        box.getSize( size );
        if (size.x < maxSize && size.y < maxSize && size.z < maxSize) {
          const position = object.userData.isDynamic ? object.position : object.getWorldPosition(new THREE.Vector3());
          this._objects.push({ position, object });
        }
      }
    });

    SceneNode.getSceneNode('Player').addEventListener('move', p => {
      this._objects.forEach(item => {
        item.object.visible = p.manhattanDistanceTo(item.position) 
          <= Frustum.MANHATTAN_DISTANCE_THRESHOLD;
      })
    });
    */
  }
}

export default Frustum;