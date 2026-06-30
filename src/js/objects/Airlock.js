/** Airlock */

import { SceneNode, MapObjectByName, Hoverable } from 'engine';
import * as THREE from 'three';
import SharedAssets from './SharedAssets';
import ObjectBaseNode from "./ObjectBaseNode";

class Airlock extends ObjectBaseNode {
  constructor(props={}) {
    super({ name: props.name ?? 'Airlock' });

    // props
    this.isAirlock = true;
    this._position = props.position ?? new THREE.Vector3();
    this._orientation = props.orientation  ?? new THREE.Vector3(0, 0, -1);
    this._code = props.code ?? [];

    // state
    this.createState({
      open: false,
      button_1: 0,
      button_2: 0,
      button_3: 0,
      button_4: 0,
      button_5: 0,
      button_6: 0,
      button_7: 0,
      button_8: 0,
    });
  }

  _init() {    
    // map object
    const group = SharedAssets.requestAsset('airlock');
    this._map = MapObjectByName( group );
    console.log(this._map);
    
    // add cosmetic
    this._map.cosmetic.lookAt(this._orientation);
    this._map.cosmetic.position.copy(this._position);
    this._addToScene( this._map.cosmetic );

    // add collision
    [ 'collision_shell', 'collision_outer_door', 'collision_inner_door' ].forEach(key => {
      const collision = new THREE.Mesh(
        this._map[key].geometry.clone(),
        this._map[key].material
      );
      const rotate = Math.atan2( this._orientation.x, this._orientation.z );
      collision.geometry.rotateY(rotate);
      collision.position.copy( this._position );
      this._addObjectToPhysicsWorld( collision );
      this._addToScene( collision );
    });
    
  }
}

export default Airlock;