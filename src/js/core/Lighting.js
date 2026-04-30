/** SceneNode */

import { SceneNode } from 'engine';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
import * as WebGPU from 'three/webgpu';
import * as THREE from 'three';

class Lighting extends SceneNode {
  constructor() {
    super({ name: 'Lighting' });
  }

  _init() {
    // add lights
    const scene = SceneNode.getSceneNode('Scene').getScene();
    this._lights = {};
    this._lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.05);
    scene.add(this._lights.ambient);
    this._lights.directional = new THREE.DirectionalLight(0xFFFFFF, 0.05);
    this._lights.directional.position.set(0, 1, 0);
    scene.add(this._lights.directional);

    // rect light
    WebGPU.RectAreaLightNode.setLTC( RectAreaLightTexturesLib.init() );
    let rectLight1 = new WebGPU.RectAreaLight( 0xff0000, 4, 2, 0.5 );
    rectLight1.position.set(-2, 0.35, 2);
    let rect = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5), 
      new THREE.MeshBasicMaterial({color:0xFF0000})
    );
    rect.position.set(-2, 0.35, 2);
    rect.rotation.y = Math.PI;
    scene.add( rectLight1, rect );
    /*
    let rectLight2 = new WebGPU.RectAreaLight( 0x00ff00, 5, 4, 10 );
    rectLight2.position.set( 0, 6, 5 );
    scene.add( rectLight2 );
    let rectLight3 = new WebGPU.RectAreaLight( 0x0000ff, 5, 4, 10 );
    rectLight3.position.set( 5, 6, 5 );
    scene.add( rectLight3 );
    */

    //const rectLight1 = new THREE.RectAreaLight( 0xff0000, 5, 4, 10 );
		//rectLight1.position.set( - 5, 6, 5 );
		//scene.add( rectLight1 );
  }
}

export default Lighting;