/** Room base class */

import { SceneNode } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import LOD from '../util/LOD';

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
        state[`power${i+1}`] = 0;
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
        this.add(ball);
      });
    }

    // add sockets
    if (this._manifest.sockets) {
      this._manifest.sockets.forEach((p, i) => {
        const name = `${this.name}_Socket_${i+1}`;
        const state = `power${i+1}`;
        const position = new THREE.Vector3().fromArray(p).add(this._position);
        const socket = new Socket({ name, position });
        socket.addEventListener('attach', () => this.setState({ [state]: 1 }));
        socket.addEventListener('detach', () => this.setState({ [state]: 0 }));
        this._map[name] = socket;
        this.add(socket);
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
  }

  /** override this */
  _onStateChanged() {
    console.log(this.state);
  }
}

export default Room;