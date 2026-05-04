/** Map */

import * as THREE from 'three';
import { SceneNode, Carryable, CentrePivot } from 'engine';

class Map extends SceneNode {
  constructor() {
    super({ name: 'Map' });

    this.load('map', './models/map.fbx');
    this.load('background', './models/background.fbx');
    this.load('interactive', './models/interactive.fbx');
  }

  _init() {
    // create scene
    this._addToScene(this.getAsset('map'));
    this._addToScene(this.getAsset('background'));

    // collisions
    const collision = this.getAsset('map').clone();
    this._addObjectToPhysicsWorld(collision);

    // test
    const interactive = [];
    this.getAsset('interactive').traverse(child => {
      if (child.isMesh) {
        interactive.push(child);
      }
    });
    interactive.forEach(mesh => {
      CentrePivot(mesh);
      const carryable = new Carryable({ mesh: mesh });
      this._addToScene(mesh);
      this.add(carryable);
    });

    /*
    const radius = 0.1;
    const circ = radius * 2 * Math.PI;
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 20), 
      new THREE.MeshStandardMaterial({color:0x0000FF, emissive:0x0000FF, emissiveIntensity: 1, wireframe:true})
    );
    globe.userData.radius = radius;
    globe.userData.circumference = circ;
    this._addToScene(globe);
    this.globe = globe;

    // on move event
    this._camera = SceneNode.getSceneNode('Camera');
    this._player = SceneNode.getSceneNode('Player');
    this._camera.addEventListener('move', p => {
      const dx = p.x - this._camera.positionPrevious.x;
      const dz = p.z - this._camera.positionPrevious.z;
      const axis = new THREE.Vector3(dx, 0, dz).normalize().cross(THREE.Object3D.DEFAULT_UP);
      const rot = Math.sqrt(dx*dx + dz*dz) / circ * Math.PI * 2 * 0.1;
      globe.rotateOnWorldAxis(axis, rot);
    });
    */
  }

  reset() {
    if (this.globe) {
      this.globe.rotation.set(0, 0, 0);
    }
  }
}

export default Map;