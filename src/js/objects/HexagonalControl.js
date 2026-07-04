/** HexagonalControl */

import { SceneNode, MapObjectByName, Hoverable } from 'engine';
import * as THREE from 'three';
import SharedAssets from '../core/SharedAssets';
import ObjectBaseNode from './ObjectBaseNode';

class HexagonalControl extends ObjectBaseNode {
  static activeMaterial = null;

  constructor(props={}) {
    super({ name: props.name ?? 'HexagonalControl' });

    // props
    this.isHexagonalControl = true;
    this._position = props.position || new THREE.Vector3();
    this._orientation = props.orientation || new THREE.Vector3(0, 1, 0);
    this._lastCursor = null;
    this._onChangeCallback = props.onChange || null;

    // state
    this.createState({
      cursor: null,
      pipe_c1: 0,
      pipe_c2: 0,
      pipe_c3: 0,
      pipe_c4: 0,
      pipe_c5: 0,
      pipe_c6: 0,
      pipe_12: 0,
      pipe_23: 0,
      pipe_34: 0,
      pipe_45: 0,
      pipe_56: 0,
      pipe_61: 0,
    });
  }

  /** init */
  _init() {
    // create shared material
    if ( ! HexagonalControl.activeMaterial ) {
      HexagonalControl.activeMaterial = new THREE.MeshPhysicalMaterial({
        emissive: 0xFFFFFF,
        emissiveIntensity: 1
      });
    }

    // get object
    const object = SharedAssets.requestAsset('hexagonal_control');
    object.lookAt(this._orientation);
    object.position.copy(this._position);
    this._addToScene(object);

    // map object
    this._map = MapObjectByName(object);
    
    // set up buttons
    this._hoverable = [];
    ['button_c', 'button_1', 'button_2', 'button_3', 'button_4', 'button_5', 'button_6'].forEach(name => {
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
      this._hoverable.push( { name, hoverable } );
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
          this._hoverable.forEach(obj => {
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
    this._hoverable.forEach(obj => {
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
        this._combinationMulti(name, this._lastCursor, 'button_1', ['button_3', 'button_4', 'button_5']) ||
        this._combinationMulti(name, this._lastCursor, 'button_2', ['button_4', 'button_5', 'button_6']) ||
        this._combinationMulti(name, this._lastCursor, 'button_3', ['button_5', 'button_6']) ||
        this._combinationMulti(name, this._lastCursor, 'button_4', ['button_6'])
      ) ? null : name;
    }

    // calculate pipe states
    if (next.cursor === null) {
      next = {
        ...next,
        pipe_c1: 0,
        pipe_c2: 0,
        pipe_c3: 0,
        pipe_c4: 0,
        pipe_c5: 0,
        pipe_c6: 0,
        pipe_12: 0,
        pipe_23: 0,
        pipe_34: 0,
        pipe_45: 0,
        pipe_56: 0,
        pipe_61: 0
      };
    } else {
      const current = this.getState();
      let found = false;
      [
        [ 'pipe_c1', 'button_c', 'button_1' ],
        [ 'pipe_c2', 'button_c', 'button_2' ],
        [ 'pipe_c3', 'button_c', 'button_3' ],
        [ 'pipe_c4', 'button_c', 'button_4' ],
        [ 'pipe_c5', 'button_c', 'button_5' ],
        [ 'pipe_c6', 'button_c', 'button_6' ],
        [ 'pipe_12', 'button_1', 'button_2' ],
        [ 'pipe_23', 'button_2', 'button_3' ],
        [ 'pipe_34', 'button_3', 'button_4' ],
        [ 'pipe_45', 'button_4', 'button_5' ],
        [ 'pipe_56', 'button_5', 'button_6' ],
        [ 'pipe_61', 'button_6', 'button_1' ],
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
      this._hoverable.forEach(obj => {
        obj.hoverable.enable();
      });
    }, 350);
  }

  /** util: check a/b combination multiples */
  _combinationMulti(a, b, key1, keys) {
    for (let i=0; i<keys.length; i++) {
      if (this._combination(a, b, key1, keys[i])) {
        return true;
      }
    }
    return false;
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
    mesh.material = state ? HexagonalControl.activeMaterial : mesh.userData.material;
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();

    // set visual
    this._setMaterial( this._map.indicator_c, state.cursor === 'button_c' );
    this._setMaterial( this._map.indicator_1, state.cursor === 'button_1' );
    this._setMaterial( this._map.indicator_2, state.cursor === 'button_2' );
    this._setMaterial( this._map.indicator_3, state.cursor === 'button_3' );
    this._setMaterial( this._map.indicator_4, state.cursor === 'button_4' );
    this._setMaterial( this._map.indicator_5, state.cursor === 'button_5' );
    this._setMaterial( this._map.indicator_6, state.cursor === 'button_6' );
    this._setMaterial( this._map.pipe_c1, state.pipe_c1 );
    this._setMaterial( this._map.pipe_c2, state.pipe_c2 );
    this._setMaterial( this._map.pipe_c3, state.pipe_c3 );
    this._setMaterial( this._map.pipe_c4, state.pipe_c4 );
    this._setMaterial( this._map.pipe_c5, state.pipe_c5 );
    this._setMaterial( this._map.pipe_c6, state.pipe_c6 );
    this._setMaterial( this._map.pipe_12, state.pipe_12 );
    this._setMaterial( this._map.pipe_23, state.pipe_23 );
    this._setMaterial( this._map.pipe_34, state.pipe_34 );
    this._setMaterial( this._map.pipe_45, state.pipe_45 );
    this._setMaterial( this._map.pipe_56, state.pipe_56 );
    this._setMaterial( this._map.pipe_61, state.pipe_61 );

    // set last cursor
    this._lastCursor = state.cursor;

    // on change callback
    if (this._onChangeCallback) {
      this._onChangeCallback( state );
    }
  }
}

export default HexagonalControl;