/** Door */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import SharedAssets from '../core/SharedAssets';

class Door extends SceneNode {
  constructor(props={}) {
    super({ name: props.name ?? 'Door' });

    this._position = props.position ?? new THREE.Vector3();
    this._orientation = props.orientation ?? new THREE.Vector3(0, 0, -1);
    this._open = false;
    this._target = 0;
  }

  _init() {
    // instanced transform
    this._object = new THREE.Object3D();
    this._object.lookAt(this._orientation);
    this._object.position.copy(this._position);
    this._instancedMeshIndex = SharedAssets.getInstancedMeshIndex( 'door', this._object );

    // collider
    const physics = SceneNode.getSceneNode('Physics');
    const sx = 0.125 + Math.abs(this._orientation.z) * 2;
    const sy = 4.25;
    const sz = 0.125 + Math.abs(this._orientation.x) * 2;
    const shape = physics.cuboidShape(sx, sy, sz);
    const { collider, rigidBody }
      = physics.createFixedCollider(shape, this._position);
    this._collider = collider;
  }

  /** util: set state */
  setOpen( open ) {
    if (open) this.open();
    else this.close();
  }

  /** set transform */
  _setInstancedTransform() {
    this._object.position.y = this._open ? this._position.y + 4.25 : this._position.y;
    this._object.updateMatrix();
    SharedAssets.getInstancedMesh('door').forEach(mesh => {
      mesh.setMatrixAt(this._instancedMeshIndex, this._object.matrix);
    });
  }

  /** open door */
  open() {
    this._open = true;
    this._collider.setEnabled( false );
    this._setInstancedTransform();
  }

  /** close door */
  close() {
    this._open = false;
    this._collider.setEnabled( true );
    this._setInstancedTransform();
  }
}

export default Door;