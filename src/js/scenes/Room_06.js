/** Room */

import { SceneNode, Carryable, CentrePivot, SetPivot, MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import SharedAssets from '../core/SharedAssets';

class Room_06 extends Room {
  constructor() {
    const r = 1.625;
    const h1 = 1.5;
    const h2 = 5.7;
    const h3 = 9.9;
    const theta45 = Math.PI * 0.25;
    const theta105 = Math.PI * 2 * (105 / 360);
    const theta135 = Math.PI * 0.75;
    const theta165 = Math.PI * 2 * (165 / 360);
    const theta225 = Math.PI * 1.25;
    const theta285 = Math.PI * 2 * (285 / 360);
    const theta315 = Math.PI * 2 * (315 / 360);
    const theta345 = Math.PI * 2 * (345 / 360);
    const manifest = {};
    manifest.circularControls = [
      [ [r, h1, 0], [1, 0, 0] ],
      [ [Math.cos(theta225) * r, h2, -Math.sin(theta225) * r], [Math.cos(theta225), 0, -Math.sin(theta225)] ],
      [ [Math.cos(theta45) * r, h2, -Math.sin(theta45) * r], [Math.cos(theta45), 0, -Math.sin(theta45)] ],
    ];
    manifest.hexagonalControls = [
      [ [Math.cos(theta45) * r, h3, -Math.sin(theta45) * r], [Math.cos(theta45), 0, -Math.sin(theta45)] ],
      [ [Math.cos(theta165) * r, h3, -Math.sin(theta165) * r], [Math.cos(theta165), 0, -Math.sin(theta165)] ],
      [ [Math.cos(theta285) * r, h3, -Math.sin(theta285) * r], [Math.cos(theta285), 0, -Math.sin(theta285)] ],
    ];
    manifest.buttons = [
      [ [0, h1, -r], 0.125 ],
      [ [-r, h1, 0], 0.125 ],
      [ [0, h1, r], 0.125 ],
      [ [Math.cos(theta315) * r, h2, -Math.sin(theta315) * r], 0.125 ],
      [ [Math.cos(theta135) * r, h2, -Math.sin(theta135) * r], 0.125 ],
      [ [Math.cos(theta105) * r, h3, -Math.sin(theta105) * r], 0.125 ],
      [ [Math.cos(theta225) * r, h3, -Math.sin(theta225) * r], 0.125 ],
      [ [Math.cos(theta345) * r, h3, -Math.sin(theta345) * r], 0.125 ]
    ];

    // setup
    super({
      name: 'Room_06',
      position: new THREE.Vector3(-96, 0, 0),
      manifest
    });
  }

  _init() {
    super._init();

    // add solutions
    this._solution = {};
    this._solution.Button_1 = { cursor: ['button_s'], pipe_nw: 1, pipe_ne: 1, pipe_se: 1, pipe_sw: 1 };
    this._solution.Button_2 = { cursor: ['button_s'], pipe_e: 1, pipe_ne: 1, pipe_nw: 1, pipe_w: 1, pipe_s: 1 };
    this._solution.Button_3 = { cursor: ['button_w'], pipe_nw: 1, pipe_s: 1, pipe_se: 1, pipe_e: 1 };
    this._solution.Button_4 = { cursor: ['button_s', 'button_w'], pipe_n: 1, pipe_s: 1, pipe_e: 1, pipe_w: 1 };
    this._solution.Button_5 = { cursor: ['button_s', 'button_n'], pipe_n: 1, pipe_s: 1, pipe_e: 1, pipe_w: 1, pipe_ne: 1, pipe_se: 1, pipe_sw: 1, pipe_nw: 1 };
    this._solution.Button_6 = { cursor: ['button_3', 'button_5', 'button_5'], pipe_c1: 1, pipe_c2: 1, pipe_c3: 1, pipe_c4: 0, pipe_c5: 1, pipe_c6: 0, pipe_12: 1, pipe_23: 1, pipe_34: 0, pipe_45: 0, pipe_56: 1, pipe_61: 0 };
    this._solution.Button_7 = { cursor: ['button_3', 'button_3', 'button_5'], pipe_c1: 1, pipe_c2: 1, pipe_c3: 1, pipe_c4: 0, pipe_c5: 1, pipe_c6: 0, pipe_12: 1, pipe_23: 1, pipe_34: 1, pipe_45: 1, pipe_56: 1, pipe_61: 0 };
    this._solution.Button_8 = { cursor: ['button_5', 'button_3', 'button_3'], pipe_c1: 1, pipe_c2: 1, pipe_c3: 0, pipe_c4: 0, pipe_c5: 0, pipe_c6: 0, pipe_12: 1, pipe_23: 1, pipe_34: 0, pipe_45: 0, pipe_56: 1, pipe_61: 0 };

    // add boxes, clues
    const object = SharedAssets.requestAsset('lidded_box');
    const clue = SharedAssets.requestAsset('circular_control_clue');
    const clueHex = SharedAssets.requestAsset('hexagonal_control_clue');
    
    const mapped = MapObjectByName(object);
    SetPivot( mapped.lid, new THREE.Vector3(0, 0.25, 0) );

    this._manifest.buttons.forEach((button, i) => {
      // create box
      const clone = object.clone();
      const p = button[0];
      const orientation = new THREE.Vector3(p[0], 0, p[2]).normalize();
      clone.lookAt(orientation);
      clone.position.set(p[0], p[1], p[2]).add(this._position);
      const name = `Room_06_Lid_${i+1}`;
      this._map[name] = clone.getObjectByName('lid');
      this._addToScene( clone );

      // create clue
      const solution = this._solution[`Button_${i+1}`];
      if (!solution) return;
      const clone2 = i >= 5 ? clueHex.clone() : clue.clone();
      clone2.lookAt(orientation);
      clone2.position.set(p[0], p[1] + 0.5, p[2]).add(this._position);
      this._addToScene(clone2);
      clone2.traverse(obj => {
        if (obj.isMesh && ! solution[obj.name]) {
          obj.visible = false;
        }
      });
    });
  }

  _afterInit() {
    // set default button state
    this._manifest.buttons.forEach((_, i) => {
      this._map[`Room_06_Button_${i+1}`].enabled = false;
    });
  }

  /** set button and box state from circular control/s */
  _setButtonEnabled(n, controls) {
    // xor controls
    const combined = {};
    controls.forEach(c => {
      const state = c.getState();
      for (const key in state) {
        if (key === 'cursor') {
          if ( ! combined.cursor ) {
            combined.cursor = [];
          }
          combined.cursor.push( state[key] );
        } else if (combined[key] === undefined) {
          combined[key] = state[key];
        } else {
          combined[key] = combined[key] ^ state[key];
        }
      }
    });

    // check solution
    const solution = this._solution[`Button_${n}`];
    let enabled = true;
    for (const key in combined) {
      if ( key === 'cursor' ) {
        if ( ! solution.cursor || solution.cursor.join(';') !== combined[key].join(';') ) {
          enabled = false;
          break;
        }
      } else if (
        ( combined[key] === 1 && ( solution[key] === undefined || solution[key] !== 1 ) ) ||
        ( (solution[key] !== undefined && solution[key] === 1) && combined[key] !== 1 )
      ) {
        enabled = false;
        break;
      }
    }

    // set enabled
    this._map[`Room_06_Button_${n}`].enabled = enabled;
    this._map[`Room_06_Lid_${n}`].rotation.x = enabled ? Math.PI * -1 : 0;
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();

    // set buttons
    this._map.Room_06_Button_1.setHex( state.button_1 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_2.setHex( state.button_2 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_3.setHex( state.button_3 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_4.setHex( state.button_4 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_5.setHex( state.button_5 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_6.setHex( state.button_6 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_7.setHex( state.button_7 ? 0xFFFFFF : 0 );
    this._map.Room_06_Button_8.setHex( state.button_8 ? 0xFFFFFF : 0 );

    // set lids
    this._setButtonEnabled( 1, [ this._map.Room_06_CircularControl_1 ] );
    this._setButtonEnabled( 2, [ this._map.Room_06_CircularControl_1 ] );
    this._setButtonEnabled( 3, [ this._map.Room_06_CircularControl_1 ] );
    this._setButtonEnabled( 4, [ this._map.Room_06_CircularControl_2, this._map.Room_06_CircularControl_3 ] );
    this._setButtonEnabled( 5, [ this._map.Room_06_CircularControl_2, this._map.Room_06_CircularControl_3 ] );
    this._setButtonEnabled( 6, [ this._map.Room_06_HexagonalControl_1, this._map.Room_06_HexagonalControl_2, this._map.Room_06_HexagonalControl_3 ] );
    this._setButtonEnabled( 7, [ this._map.Room_06_HexagonalControl_1, this._map.Room_06_HexagonalControl_2, this._map.Room_06_HexagonalControl_3 ] );
    this._setButtonEnabled( 8, [ this._map.Room_06_HexagonalControl_1, this._map.Room_06_HexagonalControl_2, this._map.Room_06_HexagonalControl_3 ] );
  }
}

export default Room_06;