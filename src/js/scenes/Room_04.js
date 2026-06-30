/** Room */

import { SceneNode, Animation, Carryable, CentrePivot, SetPivot, MapObjectByName, Hoverable, Prompt } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';

class Room_04 extends Room {
  constructor() {
    const buttons = [];
    const dist = 3;
    const offset = Math.PI * 2 / 8;
    for (let i=0; i<8; i++) {
      const theta = offset * (i + 0.5);
      const x = Math.cos(theta) * dist;
      const z = Math.sin(theta) * dist;
      buttons.push([x, 0.125, z, 0.375]);
    }

    super({
      name: 'Room_04',
      map: './models/rooms/room-04.fbx',
      collisionMap: './models/rooms/room-04-collision.fbx',
      position: new THREE.Vector3(-48, 0, 0),
      manifest: {
        ladders: [ [ [-1.5, 4.25, 0], [1, 0, 0], [1.5, 8.5] ] ],
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ], // to greenhouse
          [ [5.5, 2.125, 0], [-1, 0, 0] ], // to hub
          [ [-5.5, 2.125, 0], [-1, 0, 0] ], // to engine
        ],
        sockets: [ [[0, .3125, 0], [0, 1, 0]] ],
        balls: [ [1, 0.25, 0] ],
        airlocks: [
          [[0, 0, -6], [0, 0, -1], [3, 4, 5, 6]]
        ],
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
    this._mapped = MapObjectByName(this.getAsset('map'));
    if (this._mapped.hatch) {
      this._initHatch();
    } else {
      console.warn('No hatch found', this._mapped);
    }
  }

  /** set up hatch logic */
  _initHatch() {
    // create pivot
    const origin = new THREE.Vector3(0, 8.125, 2.125);
    SetPivot( this._mapped.hatch, origin );

    // create clickable mesh
    const box = new THREE.Box3().setFromObject(this._mapped.hatch);
    const size = box.getSize( new THREE.Vector3() );
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({color:0x00FF00, wireframe:true})
    );
    mesh.visible = false;
    mesh.position.y += size.y / 2;
    this._mapped.hatch.add(mesh);

    // create closed-hatch collider
    // rp=0 7.750 0, r=1.875 h=1
    const radius = 1.875;
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
  }

  _setHatch(open) {
    // physics
    this._collider.setEnabled( ! open );

    // enable/disable ladder
    this._map.Room_04_Ladder_1.setEnabled( open );
    
    // rotation animation
    const start = this._mapped.hatch.rotation.x;
    const stop = open ? 0 : -Math.PI / 2;
    this._hoverable.disable();
    const animation = new Animation({
      duration: 0.6,
      callback: t => {
        this._mapped.hatch.rotation.x = start + (stop - start) * t;
      },
      onEnd: () => {
        this._hoverable.enable();
      }
    });
    this.add(animation);
  }

  /** after init */
  _afterInit() {
    super._afterInit();
    
    this._map.Room_04_Ball_1.attach( this._map.Room_04_Socket_1, true );
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
        this._map[`${this.name}_Button_${n}`].setHex(
          power && state[key] ? 0x00FF00 : 0
        );
      }
    }

    // set doors
    this._map.Room_04_Door_1.setOpen( power && total == 4 && state.button_2 && state.button_3 && state.button_7 && state.button_8 );
    this._map.Room_04_Door_2.setOpen( power );
    this._map.Room_04_Door_3.setOpen( power && total == 4 && state.button_1 && state.button_2 && state.button_4 && state.button_5 );

    // set hatch
    if (changed.hatch) {
      this._setHatch( this.getState('hatch') );
    }
  }
}

export default Room_04;