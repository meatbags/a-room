/** CircularControl */

import { SceneNode, MapObjectByName, Hoverable } from 'engine';
import * as THREE from 'three';
import SharedAssets from './SharedAssets';
import ObjectBaseNode from './ObjectBaseNode';

class CircularControl extends ObjectBaseNode {
  static activeMaterial = null;

  constructor(props={}) {
    super({ name: props.name ?? 'CircularControl' });

    // props
    this.isCircularControl = true;
    this._position = props.position || new THREE.Vector3();
    this._orientation = props.orientation || new THREE.Vector3(0, 1, 0);
    this._lastCursor = null;
    this._onChangeCallback = props.onChange || null;

    // state
    this.createState({
      cursor: null,
      pipe_n: 0,
      pipe_s: 0,
      pipe_e: 0,
      pipe_w: 0,
      pipe_nw: 0,
      pipe_ne: 0,
      pipe_sw: 0,
      pipe_se: 0,
    });
  }

  /** init */
  _init() {
    // create shared material
    if ( ! CircularControl.activeMaterial ) {
      CircularControl.activeMaterial = new THREE.MeshPhysicalMaterial({
        emissive: 0xFFFFFF,
        emissiveIntensity: 1
      });
    }

    // get object
    const object = SharedAssets.requestAsset('circular_control');
    object.lookAt(this._orientation);
    object.position.copy(this._position);
    this._addToScene(object);

    // map object
    this._map = MapObjectByName(object);
    
    // set up buttons
    this._hoverableObjects = [];
    ['button_c', 'button_n', 'button_e', 'button_s', 'button_w'].forEach(name => {
      const button = this._map[name];
      const hoverable = new Hoverable(button, {
        name: `${this.name}_Hoverable_${name}`,
        radius: 2,
        onHover: () => {
          if ( ! this._canInteract() ) return;
          this._createPrompt('[e] press', 'button');
        },
        onHoverEnd: () => {
          if ( ! this._canInteract() ) return;
          this._destroyPrompt();
        },
      });
      this._hoverableObjects.push( { name, hoverable } );
      this.add(hoverable);
    });

    // keyboard listener
    const listener = this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          this._canInteract() &&
          keyboard.isKeyDown('e')
        ) {
          let found = false;
          this._hoverableObjects.forEach(obj => {
            if (!found && obj.hoverable.isHover()) {
              found = true;
              this._onButton( obj.name );
            }
          });
        }
      });
  }

  /** on button pressed */
  _onButton(name) {
    if (this._locked) return;
    this._locked = true;
    this._destroyPrompt();
    this._hoverableObjects.forEach(obj => {
      obj.hoverable.disable();
    });
    
    // calculate next state
    let next = {};

    // set cursor state
    if (this._lastCursor === null) {
      next.cursor = name;
    } else if (this._lastCursor === name) {
      next.cursor = null;
    } else {
      next.cursor = (
        this._combination(name, this._lastCursor, 'button_n', 'button_s') ||
        this._combination(name, this._lastCursor, 'button_e', 'button_w')
      ) ? null : name;
    }

    // calculate pipe states
    if (next.cursor === null) {
      next = {
        ...next,
        pipe_n: 0,
        pipe_s: 0,
        pipe_e: 0,
        pipe_w: 0,
        pipe_nw: 0,
        pipe_ne: 0,
        pipe_sw: 0,
        pipe_se: 0
      };
    } else {
      const current = this.getState();
      let found = false;
      [
        [ 'pipe_n', 'button_c', 'button_n' ],
        [ 'pipe_e', 'button_c', 'button_e' ],
        [ 'pipe_s', 'button_c', 'button_s' ],
        [ 'pipe_w', 'button_c', 'button_w' ],
        [ 'pipe_ne', 'button_n', 'button_e' ],
        [ 'pipe_se', 'button_s', 'button_e' ],
        [ 'pipe_sw', 'button_s', 'button_w' ],
        [ 'pipe_nw', 'button_n', 'button_w' ],
      ].forEach(c => {
        if (found) {
          next[c[0]] = current[c[0]];
        } else {
          found = this._combination(name, this._lastCursor, c[1], c[2]);
          next[c[0]] = found ? current[c[0]] == 0 ? 1 : 0 : current[c[0]];
        }
      });
    }

    // set state
    this.setState(next);

    setTimeout(() => {
      this._locked = false;
      this._hoverableObjects.forEach(obj => {
        obj.hoverable.enable();
      });
    }, 350);
  }

  /** util: check a/b combination */
  _combination(a, b, key1, key2) {
    return (a === key1 && b === key2) || (a === key2 && b === key1);
  }

  /** util: set mesh state */
  _setMaterial(mesh, state) {
    if ( ! mesh.userData.material ) {
      mesh.userData.material = mesh.material;
    }
    mesh.material = state ? CircularControl.activeMaterial : mesh.userData.material;
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();

    // set visual
    this._setMaterial( this._map.indicator_c, state.cursor === 'button_c' );
    this._setMaterial( this._map.indicator_n, state.cursor === 'button_n' );
    this._setMaterial( this._map.indicator_e, state.cursor === 'button_e' );
    this._setMaterial( this._map.indicator_s, state.cursor === 'button_s' );
    this._setMaterial( this._map.indicator_w, state.cursor === 'button_w' );
    this._setMaterial( this._map.pipe_n, state.pipe_n );
    this._setMaterial( this._map.pipe_e, state.pipe_e );
    this._setMaterial( this._map.pipe_s, state.pipe_s );
    this._setMaterial( this._map.pipe_w, state.pipe_w );
    this._setMaterial( this._map.pipe_ne, state.pipe_ne );
    this._setMaterial( this._map.pipe_se, state.pipe_se );
    this._setMaterial( this._map.pipe_sw, state.pipe_sw );
    this._setMaterial( this._map.pipe_nw, state.pipe_nw );

    // set last cursor
    this._lastCursor = state.cursor;

    // on change callback
    if (this._onChangeCallback) {
      this._onChangeCallback( state );
    }
  }
}

export default CircularControl;