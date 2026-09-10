/** Demo Room */

import { MapObjectByName } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Button from '../objects/Button';
import Overworld from './Overworld';
import SharedAssets from '../core/SharedAssets';

class Room_02 extends Room {
  constructor() {
    super({
      name: 'Room_02',
      position: new THREE.Vector3(0, 0, Overworld.step),
      manifest: {
        balls: [ 
          [ -3.5, 0.25, 2.5 ],
          [ -3.5, 0.25, -2.5 ]
        ],
        sockets: [
          [[-2.1213, 0.5, -2.1213], [0, 1, 0]],
          [[-2.1213, 0.5, 2.1213], [0, 1, 0]],
        ],
        doors: [ 
          [ [0, 2.125, -5.5], [0, 0, -1] ],
          [ [0, 2.125, 5.5], [0, 0, 1] ]
        ],
        dataSticks: [ [
          [2.875, 1.25, 4.188], 
          'Completed post-cryo psychological exam of the crew. Hallucinations, cognitive decline, paranoia within acceptable parameters. Anti-psychotics prescribed as necessary.'
        ] ],
      },
    });

    // extend state
    this.createState({
      ...(this.getState() || {}),
      code: 0b0101,
    });

    // extend state
    this.createState({
      ...(this.getState() || {}),
      progression_1: 0,
      progression_2: 0,
    });
  }
  
  /**
   * Initialise.
   */
  _init() {
    super._init();

    // set up puzzle
    this._mapped = MapObjectByName( this._getCosmeticMap() );

    // buttons
    const buttons = [ [ 3.5, 1, 1.5 ], [ 3.5, 1, 0.5 ], [ 3.5, 1, -0.5 ], [ 3.5, 1, -1.5 ]];
    buttons.forEach((p, i) => {
      const name = `${this.name}_Button_${i+1}`;
      const position = new THREE.Vector3().fromArray(p).add(this._position);
      const size = [0.5, 0.5, 0.5];
      const orientation = new THREE.Vector3(-1, 0, 0);
      const b = new Button({ name, position, size, visible: false, orientation });
      let xor = 0;
      if (i == 0) xor = 0b0011;
      else if (i == 1) xor = 0b0111;
      else if (i == 2) xor = 0b1110;
      else xor = 0b1100;
      b.addEventListener('press', () => {
        const code = this.getState('code');
        this.setState({ code: code ^ xor });
      });
      this.add( b );
    });
  }

  /**
   * After init.
   */
  _afterInit() {
    // set initial ball state
    this._map.Room_02_Ball_1.attach( this._map.Room_02_Socket_2, true );
  }

  /** on state changed */
  _onStateChanged(changed) {
    const state = this.getState();

    // doors
    this._map.Room_02_Door_1.setOpen( state.power_1 );
    this._map.Room_02_Door_2.setOpen( state.power_2 );

    // code boxes
    this._mapped.bit_0.material = SharedAssets.getEmissiveMaterial( state.power_1 && (state.code & 0b0001) ? 0xFFFFFF : 0x0 );
    this._mapped.bit_1.material = SharedAssets.getEmissiveMaterial( state.power_1 && (state.code & 0b0010) ? 0xFFFFFF : 0x0 );
    this._mapped.bit_2.material = SharedAssets.getEmissiveMaterial( state.power_1 && (state.code & 0b0100) ? 0xFFFFFF : 0x0 );
    this._mapped.bit_3.material = SharedAssets.getEmissiveMaterial( state.power_1 && (state.code & 0b1000) ? 0xFFFFFF : 0x0 );

    return;

    const door1 = this._map.Room_02_Door_1;
    const door2 = this._map.Room_02_Door_2;
    
    // progression ladders
    let p1 = this._getNextProgression( state.progression_1, state.power_1, state.power_2, state.power_3 );
    let p2 = this._getNextProgression( state.progression_2, state.power_3, state.power_2, state.power_1 );
    while (p1 + p2 > 4) {
      p1 -= 0.5;
      p2 -= 0.5;
    }
    if (p1 !== state.progression_1 || p2 !== state.progression_2) {
      this.setState({ progression_1: p1, progression_2: p2 });
    }

    // set door/s
    door1.setOpen( state.power_4 && p1 + p2 === 4 );
    door2.setOpen( true );

    // set visual
    this._target.scale_1 = Math.max(0.25, p1);
    this._target.scale_2 = Math.max(0.25, p2);
  }

  /**
   * Assert has power.
   * 
   * @return {boolean}
   */
  hasPower() {
    return this.getState('power_1') && this.getState('power_2');
  }


  _update() {
    if (this._mapped.room_02_puzzle_rod_1 && this._mapped.room_02_puzzle_rod_2) {
      this._mapped.room_02_puzzle_rod_1.scale.z += 
        (this._target.scale_1 - this._mapped.room_02_puzzle_rod_1.scale.z) * 0.1;
      this._mapped.room_02_puzzle_conn_1.position.z = -this._mapped.room_02_puzzle_rod_1.scale.z * 1.3125;
      this._mapped.room_02_puzzle_rod_2.scale.z += 
        (this._target.scale_2 - this._mapped.room_02_puzzle_rod_2.scale.z) * 0.1;
      this._mapped.room_02_puzzle_conn_2.position.z = this._mapped.room_02_puzzle_rod_2.scale.z * 1.3125;
    }
  }
}

export default Room_02;