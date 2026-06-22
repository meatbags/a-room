/** Door */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import LOD from '../util/LOD';

class Door extends SceneNode {
  static sharedMaterial = null;
  static sharedLODMaterial = null;

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
        color: 0xFF0000,
        transparent: false,
        opacity: 0.5,
        transmission: 1,
        thickness: 1,
        thicknessMap: new THREE.TextureLoader().load('./images/Concrete_Base_02/Concrete_Base_02_Base_Color.jpg'),
        metalness: 0,
        roughness: 0,
        ior: 1.25,
      });
      Door.sharedMaterial.thicknessMap.wrapS = THREE.RepeatWrapping;
      Door.sharedMaterial.thicknessMap.wrapT = THREE.RepeatWrapping;
      Door.sharedLODMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
      this._updateSharedMaterial = true;
    }

    // create geometries
    const geo = new THREE.BoxGeometry( this._size.x, this._size.y, this._size.z );
    this._mesh = new THREE.Mesh(geo, Door.sharedMaterial);
    this._meshLow = new THREE.Mesh(geo.clone(), Door.sharedLODMaterial);
    this._mesh.position.copy( this._position );
    this._meshLow.position.copy( this._position );
    
    // create LOD groups
    const group0 = new THREE.Group();
    const group1 = new THREE.Group();
    group0.add(this._mesh);
    group1.add(this._meshLow);
    this._lod = new LOD(this._position);
    this._lod.addLevel(group0, 0);
    this._lod.addLevel(group1, 32);

    // add to scene
    this._addToScene(group0, group1);

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
    this._meshLow.visible = false;
    this._collider.setEnabled( false );
  }

  /** close door */
  close() {
    this._open = false;
    this._mesh.visible = true;
    this._meshLow.visible = true;
    this._collider.setEnabled( true );
  }

  _update(delta) {
    // animate
    if (this._updateSharedMaterial && this._mesh.material.thicknessMap) {
      this._mesh.material.thicknessMap.offset.y += delta * 0.02;
    }
  }
}

export default Door;