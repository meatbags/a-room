/** Demo Room */

import { Animation, Blend, CentrePivot, MapObjectByName, SetPivot, Clamp, SceneNode } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import { CloneMaterial } from '../util/MaterialUtils';
import Overworld from './Overworld';

class Room_01 extends Room {
  constructor() {
    super({
      name: 'Room_01',
      position: new THREE.Vector3(0, 0, Overworld.step*2),
      manifest: {
        balls: [ [-3, 0.25, -1.5] ],
        sockets: [ [[0, 0.9375, 0], [0, 1, 0], Math.PI/6] ],
        doors: [ [[0, 2.125, -5.5], [0, 0, -1]] ],
      }
    });

    this.createState({ ...this.getState, pod_open: false });
  }
  
  _init() {
    super._init();

    // mapped
    this._mapped = MapObjectByName( this._getCosmeticMap() );

    // get shards
    if (this._mapped.glass_shards) {
      this._mapped.glass_shards.children.forEach(mesh => {
        CentrePivot( mesh );
        mesh.userData.axis = Math.random() > 0.5 ? 'x' : 'z';
        mesh.userData.speed = (Math.random() * 0.2 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
      });
    }

    // replace lights with single light material
    this._light = {};
    this._light.material = new THREE.MeshPhysicalMaterial({color: 0x0, emissive: 0xFFFFFF, emissiveIntensity: 0, roughness: 1, metalness: 0});
    this._light.age = 0;
    this._light.emissive = 0;
    this._light.emissiveRate = 1.0;
    this._light.oscillator = 0;
    this._light.oscillationRate = 0.125;
    this._light.oscillatorMidpoint = 0.2;
    this._getCosmeticMap().traverse(obj => {
      if (obj.material) {
        obj.material = CloneMaterial(obj.material, mat => {
          if (mat.emissiveIntensity == 1) {
            return this._light.material;
          } else {
            return mat;
          }
        });
      }
    });

    // open doors
    if (this._mapped.pod_door_right && this._mapped.pod_door_left) {
      const pivot = new THREE.Vector3(3.1820, 0, -3.1820);
      const rotation = Math.PI * 2 * (85 / 360);
      const duration = 1.2;
      const delay = 0.5;
      SetPivot(this._mapped.pod_door_right, pivot);
      SetPivot(this._mapped.pod_door_left, pivot);
      this.add( new Animation({
        duration: duration + delay,
        callback: t => {
          let s = t * (duration + delay);
          let t2 = Math.max(0, (s - delay) / duration);
          this._mapped.pod_door_right.rotation.y = - rotation * t2;
          this._mapped.pod_door_left.rotation.y = rotation * t2;
        },
        onEnd: () => {
          this.setState({ pod_open: true });
        }
      }) );
    }
  }

  _onStateChanged(changed) {
    const state = this.getState();
    if (state.power_1) {
      this._map.Room_01_Door_1.open();
    } else {
      this._map.Room_01_Door_1.close();
    }
    if (changed.pod_open && state.pod_open) {
      if (this._mapped.pod_door_right) this._mapped.pod_door_right.rotation.y = - Math.PI * 2 * (85 / 360);
      if (this._mapped.pod_door_left) this._mapped.pod_door_left.rotation.y = Math.PI * 2 * (85 / 360);
    }
  }

  /**
   * Assert has power.
   * 
   * @return {boolean}
   */
  hasPower() {
    return this.getState('power_1');
  }

  /**
   * Update.
   * 
   * @param {number} delta
   */
  _update( delta ) {
    // light material animation
    const di = (this.hasPower() ? 1 : -1) * delta;
    this._light.age += delta;
    this._light.oscillator = this._light.oscillatorMidpoint - Math.cos(this._light.oscillationRate * Math.PI * 2 * this._light.age) * this._light.oscillatorMidpoint;
    this._light.emissive = Clamp(this._light.emissive + this._light.emissiveRate * di, 0, 1);
    this._light.material.emissiveIntensity = Blend(this._light.oscillator, 1, this._light.emissive);
    this._light.material.emissive.setRGB(1, this._light.emissive, this._light.emissive);

    // rotate objects
    if (this._mapped.glass_shards) {
      this._mapped.glass_shards.children.forEach(mesh => {
        mesh.rotation[mesh.userData.axis] += delta * mesh.userData.speed;
      });
    }
  }
}

export default Room_01;