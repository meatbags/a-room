/** Airlock */

import { SceneNode, Animation, MapObjectByName, Carryable, Hoverable, CentrePivot, SetPivot } from 'engine';
import * as THREE from 'three';
import SharedAssets from '../core/SharedAssets';
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
    // map object, set pivots, positions
    const group = SharedAssets.requestAsset('airlock');
    this._map = MapObjectByName( group );
    this._map.airlock_inner_door.geometry = this._map.airlock_inner_door.geometry.clone();
    this._map.airlock_outer_door.geometry = this._map.airlock_outer_door.geometry.clone();
    this._map.codebox_lever.geometry = this._map.codebox_lever.geometry.clone();
    SetPivot( this._map.airlock_inner_door, new THREE.Vector3(1.75, 0, 3) );
    SetPivot( this._map.airlock_outer_door, new THREE.Vector3(1.75, 0, 8.75) );
    SetPivot( this._map.codebox_lever, new THREE.Vector3(2.1250, 2, 5.8750) );
    const rotation = Math.atan2( this._orientation.x, this._orientation.z );
    const up = new THREE.Vector3(0, 1, 0); 
    const box = new THREE.Box3().setFromObject( this._map.codebox_box );
    this._codeboxPosition = box.getCenter(new THREE.Vector3()).applyAxisAngle(up, rotation).add(this._position);  

    // add cosmetic, apply orientation, position
    this._map.cosmetic.lookAt(this._orientation);
    this._map.cosmetic.position.copy(this._position);
    this._addToScene( this._map.cosmetic );

    // set shadows
    this._map.cosmetic.children.forEach(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // set buttons
    this._hoverableObjects = []; 
    for (let i=0; i<8; i++) {
      const name = `button_${i+1}`;
      const button = this._map[name];
      button.geometry = button.geometry.clone();
      CentrePivot( button );
      const hoverable = new Hoverable(button, {
        name: `${this.name}_Hoverable_${name}`,
        radius: 2,
        onHover: () => {
          if ( ! this._canInteract(this._codeboxPosition) ) return;
          this._createPrompt('[e] press', 'button');
        },
        onHoverEnd: () => {
          if ( ! this._canInteract(this._codeboxPosition) ) return;
          this._destroyPrompt();
        },
      });
      this._hoverableObjects.push( { name, hoverable } );
      this.add(hoverable);
    }

    // set lever
    box.setFromObject( this._map.codebox_lever );
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, 1), new THREE.MeshBasicMaterial({color:0x0000FF, wireframe:true}));  
    mesh.visible = false;
    box.getCenter(mesh.position);
    this._map.cosmetic.add(mesh);
    this._hoverableLever = new Hoverable(mesh, {
      name: `${this.name}_Hoverable_lever`,
      radius: 2,
      onHover: () => {
        if ( ! this._canInteract(this._codeboxPosition) ) return;
        const verb = this.getState('open') ? 'close' : 'open';
        this._createPrompt(`[e] ${verb} airlock`, 'button');
      },
      onHoverEnd: () => {
        if ( ! this._canInteract(this._codeboxPosition) ) return;
        this._destroyPrompt();
      },
    });
    this.add(this._hoverableLever);

    // keyboard listener
    const listener = this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          this._canInteract(this._codeboxPosition) &&
          keyboard.isKeyDown('e')
        ) {
          let found = false;
          this._hoverableObjects.forEach(obj => {
            if (!found && obj.hoverable.isHover()) {
              found = true;
              this._onButton(obj.name);
            }
          });
          if (!found && this._hoverableLever.isHover()) {
            this._onLever();
          }
        }
      });

    // add collision
    [ 'collision_shell', 'collision_outer_door', 'collision_inner_door' ].forEach(key => {
      const collision = new THREE.Mesh(
        this._map[key].geometry.clone(),
        this._map[key].material
      );
      collision.geometry.rotateY(rotation);
      collision.position.copy( this._position );
      this._addObjectToPhysicsWorld( collision );
      this._addToScene( collision );
      this._map[key].userData.collisionMesh = collision;
    }); 
  
    console.log(this._map);
  }

  /** after init */
  _afterInit() {
    // set default state
    this._setAirlock( false );
  }

  /** on lever */
  _onLever() {
    // close airlock
    if ( this.getState('open') ) {
      this._hoverableObjects.forEach(obj => {
        obj.hoverable.enable();
      });
      this.setState({ open: false });

    // try to open airlock
    } else {
      const state = this.getState();
      let ok = true;
      for (let i=0; i<8; i++) {
        const n = i + 1;
        const button = state[`button_${n}`];
        const includes = this._code.includes(n);
        if (
          (button && !includes) || (!button && includes)
        ) {
          ok = false;
          break;
        }
      }
      if (ok) {
        this._hoverableObjects.forEach(obj => {
          obj.hoverable.disable();
        });
        this.setState({ open: true });
      } else {
        this._doFailAnimation();
      }
    }
  }

  /** on button press */
  _onButton(name) {
    if (this._locked) return;
    this._locked = true;
    this._destroyPrompt();
    this._hoverableObjects.forEach(obj => {
      obj.hoverable.disable();
    });

    // set state
    this.setState({ [name]: this.getState(name) == 1 ? 0 : 1 });

    setTimeout(() => {
      this._locked = false;
      this._hoverableObjects.forEach(obj => {
        obj.hoverable.enable();
      });
    }, 150);
  }

  _doFailAnimation() {
    if (this._locked) return;
    this._locked = true;
    this._destroyPrompt();
    this._hoverableLever.disable();
    this._hoverableObjects.forEach(obj => {
      obj.hoverable.disable();
    });

    // animation
    let done = false;
    const state = this.getState();
    for (const key in state) {
      if (key.indexOf('button') !== -1 && state[key]) {
        this._map[key].material = SharedAssets.getEmissiveMaterial(0xFF0000);
      }
    }
    this.add(new Animation({
      duration: 0.5,
      onEnd: () => {
        for (const key in state) {
          if (key.indexOf('button') !== -1 && state[key]) {
            this._map[key].material = SharedAssets.getEmissiveMaterial(0xFFFFFF);
          }
        }
        this._locked = false;
        this._hoverableLever.enable();
        this._hoverableObjects.forEach(obj => {
          obj.hoverable.enable();
        });
      }
    }));
  }

  /** util: set mesh state */
  _setMaterial(mesh, button, open) {
    if ( ! mesh.userData.material ) {
      mesh.userData.material = mesh.material;
    }
    mesh.material = button ? ( open ? 
        SharedAssets.getEmissiveMaterial(0x00FF00) 
          : SharedAssets.getEmissiveMaterial(0xFFFFFF)
      ) : mesh.userData.material;
  }

  /** set airlock state */
  _setAirlock( open, changed=false ) {
    // close airlock
    if ( ! open ) {
      this._map.codebox_lever.rotation.x = -Math.PI * 1/3;
      this._map.airlock_inner_door.rotation.y = -Math.PI / 2;
      this._map.airlock_outer_door.rotation.y = 0;
      this._map.collision_inner_door.userData.collisionMesh.userData.collider.setEnabled( false );
      this._map.collision_outer_door.userData.collisionMesh.userData.collider.setEnabled( true );

    // open airlock
    } else {
      this._map.codebox_lever.rotation.x = Math.PI * 1/3;
      this._map.airlock_inner_door.rotation.y = 0;
      this._map.airlock_outer_door.rotation.y = Math.PI / 2;
      this._map.collision_inner_door.userData.collisionMesh.userData.collider.setEnabled( true );
      this._map.collision_outer_door.userData.collisionMesh.userData.collider.setEnabled( false );
    }

    // on state changed -- todo animate
    if (changed) {
      this._hoverableLever.disable();
      setTimeout(() => {
        this._hoverableLever.enable();
      }, 150);
    }
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();

    // set button materials
    this._setMaterial( this._map.button_1, state.button_1, state.open );
    this._setMaterial( this._map.button_2, state.button_2, state.open );
    this._setMaterial( this._map.button_3, state.button_3, state.open );
    this._setMaterial( this._map.button_4, state.button_4, state.open );
    this._setMaterial( this._map.button_5, state.button_5, state.open );
    this._setMaterial( this._map.button_6, state.button_6, state.open );
    this._setMaterial( this._map.button_7, state.button_7, state.open );
    this._setMaterial( this._map.button_8, state.button_8, state.open );

    // set open, closed
    this._setAirlock( state.open, changed.open );
  }
}

export default Airlock;