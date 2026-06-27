/** Room base class */

import { SceneNode, Ladder } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import LOD from '../util/LOD';
import Ball from './Ball';
import Button from './Button';
import DataStick from './DataStick';
import Door from './Door';
import Socket from './Socket';
import Terminal from './Terminal';
import CircularControl from './CircularControl';

// testing
import { optimisationMaterial } from '../util/CreateInstancedMeshes';
import HexagonalControl from './HexagonalControl';

class Room extends SceneNode {
  static ACTIVE_DISTANCE = 32;

  constructor(props={}) {
    super({ name: props.name ?? 'Room' });

    // props
    this._map = {};
    this._manifest = props.manifest ?? {};
    this._position = props.position ?? new THREE.Vector3();

    // load models
    if (props.map) this.load('map', props.map);
    if (props.collisionMap) this.load('collision', props.collisionMap);
    if (props.mapLow) this.load('lowpoly', props.mapLow);

    // create state
    const state = {};
    if (this._manifest.sockets) {
      this._manifest.sockets.forEach((_, i) => {
        state[`power_${i+1}`] = 0;
      });
    }
    if (this._manifest.buttons) {
      this._manifest.buttons.forEach((_, i) => {
        state[`button_${i+1}`] = 0;
      });
    }
    if (this._manifest.circularControls) {
      this._manifest.circularControls.forEach((_, i) => {
        const prefix = `circular_control_${i+1}_`;
        state[`${prefix}cursor`] = null;
        state[`${prefix}pipe_n`] = 0;
        state[`${prefix}pipe_s`] = 0;
        state[`${prefix}pipe_e`] = 0;
        state[`${prefix}pipe_w`] = 0;
        state[`${prefix}pipe_nw`] = 0;
        state[`${prefix}pipe_ne`] = 0;
        state[`${prefix}pipe_sw`] = 0;
        state[`${prefix}pipe_se`] = 0;
      });
      state.circular_control_version = 0;
    }
    if (this._manifest.hexagonalControls) {
      this._manifest.hexagonalControls.forEach((_, i) => {
        const prefix = `hexagonal_control_${i+1}_`;
        state[`${prefix}cursor`] = null;
        state[`${prefix}pipe_c1`] = 0;
        state[`${prefix}pipe_c2`] = 0;
        state[`${prefix}pipe_c3`] = 0;
        state[`${prefix}pipe_c4`] = 0;
        state[`${prefix}pipe_c5`] = 0;
        state[`${prefix}pipe_c6`] = 0;
        state[`${prefix}pipe_12`] = 0;
        state[`${prefix}pipe_23`] = 0;
        state[`${prefix}pipe_34`] = 0;
        state[`${prefix}pipe_45`] = 0;
        state[`${prefix}pipe_56`] = 0;
        state[`${prefix}pipe_61`] = 0;
      });
      state.hexagonal_control_version = 0;
    }
    this.createState(state);
  }

  /** init room */
  _init() {
    // add cosmetic map, lod
    const map = this.getAsset('map');
    if (map) {
      ExtractMeshes( map ).forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
      map.position.copy( this._position );
      this._addToScene( map );
    }

    // set LODs
    /*
    let lowpoly = this.getAsset('lowpoly');
    if (!lowpoly) {
      lowpoly = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1), 
        new THREE.MeshPhysicalMaterial({ color:0xFF0000 })
      );
    }
    // add lowpoly LOD
    if (lowpoly) {
      ExtractMeshes( lowpoly ).forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
      lowpoly.position.copy( this._position );
      this._addToScene( lowpoly );

      // create LOD
      this._lod = new LOD( this._position );
      this._lod.addLevel( map, 0 );
      this._lod.addLevel( lowpoly, 40 );
    }
    */

    // add collision map
    const collision = this.getAsset('collision');
    if (collision) {
      collision.position.copy( this._position );
      this._addObjectToPhysicsWorld( collision );
      this._addToScene( collision );
    }

    // add balls
    if (this._manifest.balls) {
      this._manifest.balls.forEach((p, i) => {
        const name = `${this.name}_Ball_${i+1}`;
        const position = new THREE.Vector3().fromArray(p).add(this._position);
        const ball = new Ball({ name, position });
        this._map[name] = ball;
        this.add( ball );
      });
    }

    // add sockets
    if (this._manifest.sockets) {
      this._manifest.sockets.forEach((p, i) => {
        const name = `${this.name}_Socket_${i+1}`;
        const state = `power_${i+1}`;
        const position = new THREE.Vector3().fromArray( p[0] ).add(this._position);
        const orientation = new THREE.Vector3().fromArray( p[1] ).normalize();
        const rotation = p.length > 2 ? p[2] : 0;
        const socket = new Socket({ name, position, orientation, rotation });
        socket.addEventListener('attach', () => this.setState({ [state]: 1 }));
        socket.addEventListener('detach', () => this.setState({ [state]: 0 }));
        this._map[name] = socket;
        this.add( socket );
      });
    }

    // add buttons
    if (this._manifest.buttons) {
      this._manifest.buttons.forEach((p, i) => {
        const name = `${this.name}_Button_${i+1}`;
        const state = `button_${i+1}`;
        const position = new THREE.Vector3().fromArray([p[0], p[1], p[2]]).add(this._position);
        const size = p.length > 3 ? p[3] : 0.125;
        const button = new Button({ name, position, size });
        button.addEventListener('press', () => {
          const current = this.getState( state );
          this.setState({ [state]: current == 1 ? 0 : 1 });
        });
        this._map[name] = button;
        this.add( button );
      });
    }

    // circular controls
    if (this._manifest.circularControls) {
      this._manifest.circularControls.forEach((p, i) => {
        const name = `${this.name}_CircularControl_${i+1}`;
        const position = new THREE.Vector3().fromArray( p[0] ).add(this._position);
        const orientation = new THREE.Vector3().fromArray( p[1] ).normalize();
        const prefix = `circular_control_${i+1}_`;
        const onChange = state => {
          const next = {};
          for (const key in state) {
            next[`${prefix}${key}`] = state[key];
          }
          next.circular_control_version = this.getState('circular_control_version') + 1;
          this.setState( next );
        };
        const circularControl = new CircularControl({ name, position, orientation, onChange });
        this._map[name] = circularControl;
        this.add( circularControl );
      });
    }

    // hexagonal controls
    if (this._manifest.hexagonalControls) {
      this._manifest.hexagonalControls.forEach((p, i) => {
        const name = `${this.name}_HexagonalControl_${i+1}`;
        const position = new THREE.Vector3().fromArray( p[0] ).add(this._position);
        const orientation = new THREE.Vector3().fromArray( p[1] ).normalize();
        const prefix = `hexagonal_control_${i+1}_`;
        const onChange = state => {
          const next = {};
          for (const key in state) {
            next[`${prefix}${key}`] = state[key];
          }
          next.hexagonal_control_version = this.getState('hexagonal_control_version') + 1;
          this.setState( next );
        };
        const hexagonalControl = new HexagonalControl({ name, position, orientation, onChange });
        this._map[name] = hexagonalControl;
        this.add( hexagonalControl );
      });
    }

    // add doors
    if (this._manifest.doors) {
      this._manifest.doors.forEach((ps, i) => {
        const name = `${this.name}_Door_${i+1}`;
        const position = new THREE.Vector3().fromArray(ps[0]).add(this._position);
        const orientation = new THREE.Vector3().fromArray(ps[1]);
        const door = new Door({ name, position, orientation });
        this._map[name] = door;
        this.add( door );
      });
    }

    // add terminals
    if (this._manifest.terminals) {
      this._manifest.terminals.forEach((pr, i) => {
        const name = `${this.name}_Terminal_${i}`;
        const position = new THREE.Vector3().fromArray(pr[0]).add(this._position);
        const rotation = pr[1];
        const terminal = new Terminal({ name, position, rotation });
        this._map[name] = terminal;
        this.add( terminal );
      });
    }

    // add data sticks
    if (this._manifest.dataSticks) {
      this._manifest.dataSticks.forEach((prt, i) => {
        const name = `${this.name}_DataStick_${i}`;
        const position = new THREE.Vector3().fromArray(prt[0]).add(this._position);
        // const rotation = new THREE.Euler().fromArray(prt[1]);
        const text = prt[1];
        const dataStick = new DataStick({ name, position, text });
        this._map[name] = dataStick;
        this.add( dataStick );
      });
    }

    // add ladders
    if (this._manifest.ladders) {
      this._manifest.ladders.forEach((item, i) => {
        const name = `${this.name}_Ladder_${i+1}`;
        const position = new THREE.Vector3().fromArray(item[0]).add(this._position);
        const normal = new THREE.Vector3().fromArray(item[1]);
        const width = item[2][0];
        const height = item[2][1];
        const ladder = new Ladder({ position, normal, width, height });
        this._map[name] = ladder;
        this.add( ladder );
      });
    }
  }

  /** after init */
  _afterInit() {
    this.getAsset('map').traverse(obj => {
      if (obj.isMesh) {
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map(m => {
            return m.name.indexOf('clue') == -1 ? optimisationMaterial : m;
          });
        } else {
          obj.material = optimisationMaterial;
        }
      }
    });
  }

  /** override this */
  _onStateChanged() {
    console.log(this.state);
  }
}

export default Room;