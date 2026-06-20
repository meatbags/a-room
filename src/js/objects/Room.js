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

class Room extends SceneNode {
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
    this.createState(state);
  }

  /** init room */
  _init() {
    // add cosmetic map
    const map = this.getAsset('map');
    const lowpoly = this.getAsset('lowpoly');
    if (map) {
      ExtractMeshes( map ).forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
      map.position.copy( this._position );
      this._addToScene( map );

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
        this._lod.addLevel( lowpoly, 48 );
      }
    }

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
        const position = new THREE.Vector3().fromArray([p[0], p[1], p[2]]).add(this._position);
        const socket = new Socket({ name, position });
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

    // add doors
    if (this._manifest.doors) {
      this._manifest.doors.forEach((ps, i) => {
        const name = `${this.name}_Door_${i+1}`;
        const position = new THREE.Vector3().fromArray(ps[0]).add(this._position);
        const size = new THREE.Vector3().fromArray(ps[1]);
        const door = new Door({ name, position, size });
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

  /** override this */
  _onStateChanged() {
    console.log(this.state);
  }
}

export default Room;