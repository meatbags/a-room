/** Room */

import { SceneNode, Animation, Carryable, CentrePivot, SetPivot, MapObjectByName, Hoverable, Prompt } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import SharedAssets from '../core/SharedAssets';
import DataStick from '../objects/DataStick';

class Room_04 extends Room {
  constructor() {
    const buttons = [];
    const dist = 4.75;
    const offset = Math.PI * 2 / 8;
    for (let i=0; i<8; i++) {
      const theta = offset * (i + 0.5);
      const x = Math.cos(theta) * dist;
      const z = Math.sin(theta) * dist;
      buttons.push([[x, 1.5625, z], [0.5, 0.875, 0.5], [x, 0, z], false]);
    }

    super({
      name: 'Room_04',
      position: new THREE.Vector3(-48, 0, 0),
      manifest: {
        ladders: [ [ [-0.875, 4.25, 0], [1, 0, 0], [1.5, 8.5] ] ],
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ], // to greenhouse
          [ [5.5, 2.125, 0], [-1, 0, 0] ], // to hub
          [ [0, 2.125, -5.5], [0, 0, 1] ], // to airlock
          [ [-5.5, 2.125, 0], [-1, 0, 0] ], // to engineering
        ],
        sockets: [ [[3.125, 1.625, -3.125], [-1, 0, 1]] ],
        balls: [ [1, 0.25, 0] ],
        airlocks: [
          [[0, 0, -6.5], [0, 0, -1], [3, 4, 5, 6]]
        ],
        terminals: [
          [ [4, 8.875, 0], Math.PI ]
        ],
        dataSticks: [ [[3.3125, 9.25, 1.5], 
          `I've rewired the CO₂ scrubbers to the door controls; should make it harder for the others to move about. Sleep with the hatch closed. We'll get through this.`
        ] ],
        buttons,
      }
    });

    // extend state
    this.createState({
      ...(this.getState() || {}),
      hatch: true,
    })
  }

  _init() {
    super._init();

    // get hatch target
    this._mapped = MapObjectByName(this._getCosmeticMap());
    if ( ! this._mapped.room_04_hatch ) {
      console.error('No hatch found', this._mapped);
      return;
    }

    // init hatch
    this._hatch = this._mapped.room_04_hatch;
    const origin = new THREE.Vector3(0, 8.125, 1.4165);
    SetPivot( this._hatch, origin );

    // clickable mesh
    const box = new THREE.Box3().setFromObject(this._hatch);
    const size = box.getSize( new THREE.Vector3() );
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({color:0x00FF00, wireframe:true})
    );
    mesh.visible = false;
    mesh.position.y += size.y / 2;
    this._hatch.add(mesh);

    // create hatch collider
    // relp=0 7.750 0, r=1.25, h=1
    const radius = 1.25;
    const radiusSqr = radius * radius;
    const physics = SceneNode.getSceneNode('Physics');
    const shape = physics.cylinderShape(1, radius);
    const { collider, rigidBody }
      = physics.createFixedCollider(shape, new THREE.Vector3(0, 7.75, 0).add(this._position));
    this._collider = collider;
    this._collider.setEnabled( false );

    // utils
    const createPrompt = text => {
      destroyPrompt();
      this._prompt = new Prompt({
        name: this.name + '_Prompt',
        text: text,
      });
      this.add(this._prompt);
    };
    const destroyPrompt = () => {
      if (this._prompt) {
        this._prompt.destroy();
        this._prompt = null;
      }
    };
    const refPlayer = SceneNode.getSceneNode('Player');
    const canInteract = () => {
      const p = refPlayer.getPosition();
      const ok = ! Carryable.currentTarget && 
        ! DataStick.reading &&
        ! this._map.Room_04_Ladder_1.playerOnLadder() &&
        p.y >= 8 &&
        Math.pow(p.x-this._position.x, 2) + Math.pow(p.z-this._position.z, 2) > radiusSqr;
      if (!ok) {
        // destroyPrompt();
      }
      return ok;
    };

    // hoverable
    this._hoverable = new Hoverable(mesh, {
      name: `${this.name}_Hoverable`,
      radius: 3.5,
      onHover: () => {
        if ( ! canInteract() ) return;
        const open = this.getState('hatch');
        createPrompt( open ? '[e] close hatch' : '[e] open hatch' );
      },
      onHoverEnd: () => {
        if ( ! canInteract() ) return;
        destroyPrompt();
      },
    });
    this.add(this._hoverable);

    // keyboard event
    const listener = this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          ! canInteract() || 
          ! this._hoverable.isHover() ||
          ! keyboard.isKeyDown('e')
        ) return;
        const current = this.getState('hatch');
        this.setState({ hatch: ! current });
      });

    // create fan animation
    this._fans = [];
    for (let i=0; i<8; i++) {
      const object = new THREE.Object3D();
      const button = this._manifest.buttons[i];
      const axis = new THREE.Vector3().fromArray(button[2]).negate();
      const position = new THREE.Vector3(
        button[0][0] + this._position.x + axis.x * 0.03125,
        4.75,
        button[0][2] + this._position.z + axis.z * 0.03125,
      );
      object.lookAt( axis );
      object.position.copy( position );
      object.updateMatrix();
      const index = SharedAssets.getInstancedMeshIndex('box_fan', object);
      this._fans.push({ index, object, position, axis });
    }
  }

  /** after init */
  _afterInit() {    
    this._map.Room_04_Ball_1.attach( this._map.Room_04_Socket_1, true );
  }

  _setHatch(open) {
    // physics
    this._collider.setEnabled( ! open );

    // enable/disable ladder
    this._map.Room_04_Ladder_1.setEnabled( open );
    
    // rotation animation
    const start = this._hatch.rotation.x;
    const stop = open ? 0 : -Math.PI / 2;
    this._hoverable.disable();
    const animation = new Animation({
      duration: 0.6,
      callback: t => {
        this._hatch.rotation.x = start + (stop - start) * t;
      },
      onEnd: () => {
        this._hoverable.enable();
      }
    });
    this.add(animation);
  }

  /** util: check door condition */
  _doorCondition( door, power, total, state ) {
    let bits = 0;
    for (let i=0; i<8; i++) {
      if (state[`button_${i+1}`]) {
        bits += 1 << i;
      }
    }
    if (door == 1) {
      return power && (
        ( total == 3 && bits === 0b10000110 ) ||
        ( total == 4 && bits === 0b10011100 ) ||
        ( total == 6 && bits === 0b11101110 ) ||
        ( total == 5 && bits === 0b11110100 )
      );
    } else if (door == 2) {
      return power;
    } else if (door == 3) {
      return power && (
        ( total == 3 && bits === 0b01101000 ) ||
        ( total == 4 && bits === 0b01110010 ) ||
        ( total == 6 && bits === 0b11101110 ) ||
        ( total == 5 && bits === 0b11110100 )
      );
    } else {
      return power && (
        ( total == 3 && bits === 0b00011010 ) ||
        ( total == 4 && (bits === 0b10011100 || bits === 0b01110010 )) ||
        ( total == 5 && bits === 0b11110100 )
      );
    }
  }

  /** on state changed */
  _onStateChanged( changed ) {
    const state = this.getState();

    // check buttons, power
    const power = state.power_1;
    let total = 0;
    for (const key in state) {
      if (key.indexOf('button') !== -1) {
        total += state[key];
        const n = key.split('_')[1];
        this._mapped[`lever_${n}`].position.y = state[key] ? -0.625 : 0;
        this._mapped[`indicator_${n}`].material = 
          SharedAssets.getEmissiveMaterial(power && state[key] ? 0x00FF00 : 0xFF0000);
        const i = parseInt(n) - 1;
        this._fans[i].frequency = power && state[key] ? 1 : 0;
      }
    }

    // set doors
    this._map.Room_04_Door_1.setOpen( this._doorCondition(1, power, total, state) );
    this._map.Room_04_Door_2.setOpen( this._doorCondition(2, power, total, state) );
    this._map.Room_04_Door_3.setOpen( this._doorCondition(3, power, total, state) );
    this._map.Room_04_Door_4.setOpen( this._doorCondition(4, power, total, state) );

    // set hatch
    if (changed.hatch) {
      this._setHatch( this.getState('hatch') );
    }
  }

  _update(delta) {
    this._fans.forEach(fan => {
      if ( ! fan.meshes ) {
        fan.meshes = SharedAssets.getInstancedMesh('box_fan');
        fan.object.rotation.z = Math.random() * Math.PI;
      }
      fan.object.rotation.z += (fan.frequency ?? 0) * Math.PI * 2 * delta;
      fan.object.updateMatrix();
      fan.meshes[1].setMatrixAt(fan.index, fan.object.matrix);
    });
  }
}

export default Room_04;