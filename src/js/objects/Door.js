/** Door */

import { SceneNode } from 'engine';
import * as THREE from 'three';

class Door extends SceneNode {
  static sharedMaterial = null;

  constructor(props={}) {
    super({ name: props.name ?? 'Door' });

    this._position = props.position ?? new THREE.Vector3();
    this._size = props.size ?? new THREE.Vector3(1, 1, 1);
    this._open = false;
    this._target = 0;
  }

  _init() {
    if ( ! Door.sharedMaterial ) {
      Door.sharedMaterial = new THREE.MeshPhysicalMaterial({
        color:0xFF0000,
        opacity: 1,
        transmission: 1,
        thickness: 1,
        thicknessMap: new THREE.TextureLoader().load('./images/Concrete_Base_02/Concrete_Base_02_Base_Color.jpg'),
        metalness: 0,
        roughness: 0,
        ior: 1.25,
      });
      this._updateSharedMaterial = true;
    }

    this._mesh = new THREE.Mesh(
      new THREE.BoxGeometry( this._size.x, this._size.y, this._size.z ),
      Door.sharedMaterial
    );
    this._mesh.material.thicknessMap.wrapS = THREE.RepeatWrapping;
    this._mesh.material.thicknessMap.wrapT = THREE.RepeatWrapping;
    this._mesh.position.copy( this._position );
    this._addToScene( this._mesh );

    // collider
    const physics = SceneNode.getSceneNode('Physics');
    const shape = physics.cuboidShape(this._size.x, this._size.y, this._size.z);
    const { collider, rigidBody }
      = physics.createFixedCollider(shape, this._position);
    this._collider = collider;
  }

  /** util: set state */
  setOpen( open ) {
    if (open) this.open();
    else this.close();
  }

  /** open door */
  open() {
    this._open = true;
    this._mesh.visible = false;
    this._collider.setEnabled( false );
  }

  /** close door */
  close() {
    this._open = false;
    this._mesh.visible = true;
    this._collider.setEnabled( true );
  }

  _update(delta) {
    // animate
    if (this._updateSharedMaterial) {
      this._mesh.material.thicknessMap.offset.y += delta * 0.02;
    }
  }
}

export default Door;