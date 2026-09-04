/** Door */

import { SceneNode, MapObjectByName, Clamp } from 'engine';
import * as THREE from 'three';
import SharedAssets from '../core/SharedAssets';

class Door extends SceneNode {
  static distance = 3.75;
  static speed = 1.5;
  static offset = 0.675;

  constructor(props={}) {
    super({ name: props.name ?? 'Door' });

    // props
    this._position = props.position ?? new THREE.Vector3();
    this._orientation = props.orientation ?? new THREE.Vector3(0, 0, -1);
    this._open = false;
    this._target = 0;
    this._nearCamera = false;
  }

  _init() {
    // instanced transform
    this._object = new THREE.Object3D();
    this._object.lookAt(this._orientation);
    this._object.position.copy(this._position);

    // get mesh
    const group = SharedAssets.requestAsset('door');
    this._object.add(group);
    this._map = MapObjectByName(group);
    this._map.door_frame.geometry.translate(0, -0.005859375, 0);
    this._addToScene(this._object);

    // collider
    const physics = SceneNode.getSceneNode('Physics');
    const sx = 0.125 + Math.abs(this._orientation.z) * 2;
    const sy = 4.25;
    const sz = 0.125 + Math.abs(this._orientation.x) * 2;
    const shape = physics.cuboidShape(sx, sy, sz);
    const { collider, rigidBody }
      = physics.createFixedCollider(shape, this._position);
    this._collider = collider;

    // events
    SceneNode.getSceneNode('Camera').addEventListener('move', position => {
      this._nearCamera = Math.abs(position.x - this._position.x) < Door.distance &&
        Math.abs(position.z - this._position.z) < Door.distance;
    });
  }

  /** util: set state */
  setOpen(open) {
    if (open) {
      this.open();
    } else {
      this.close();
    }
  }

  /** set transform */
  _setInstancedTransform() {
    return; 

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
    this._map.door_frame.material = SharedAssets.getEmissiveMaterial(0x00FF00);
  }

  /** close door */
  close() {
    this._open = false;
    this._collider.setEnabled( true );
    this._map.door_frame.material = SharedAssets.getEmissiveMaterial(0xFF0000);
  }

  /**
   * Update. 
   */
  _update(delta) {
    // open door
    if (this._open && this._nearCamera) {
      if (this._map.door_left.position.x == Door.offset) {
        return;
      }
      const dx = Door.speed * delta;
      this._map.door_left.position.x = Clamp(this._map.door_left.position.x + dx, 0, Door.offset);
      this._map.door_right.position.x = Clamp(this._map.door_right.position.x - dx, -Door.offset, 0);
    
    // close door
    } else {
      if (this._map.door_left.position.x == 0) {
        return;
      }
      const dx = Door.speed * delta;
      this._map.door_left.position.x = Clamp(this._map.door_left.position.x - dx, 0, Door.offset);
      this._map.door_right.position.x = Clamp(this._map.door_right.position.x + dx, -Door.offset, 0);
    }
  }
}

export default Door;