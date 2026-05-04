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
    this._lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(this._lights.ambient);
    this._lights.directional = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    this._lights.directional.position.set(1, 0.5, 1);
    scene.add(this._lights.directional);

    // rect light
    /*
    WebGPU.RectAreaLightNode.setLTC( RectAreaLightTexturesLib.init() );

    this.rectLights = [];
    const rectLightsGroup = new THREE.Group();
    rectLightsGroup.position.y = 0.75;
    const size = 0.25;
    const offset = 0.5;
    for (let x=-offset; x<=offset; x+=offset) {
      for (let y=-offset; y<=offset; y+=offset) {
        // light
        const light = new WebGPU.RectAreaLight( 0xFFFFFF, size, size, 0.5 );
        light.position.set(x, y, 0);
        
        // rect
        const rect = new THREE.Mesh(
          new THREE.PlaneGeometry(size, size), 
          new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true})
        );
        rect.rotation.y = Math.PI;

        // refs
        light.userData.amp = 4;
        light.userData.hz = 1;
        light.userData.age = Math.random() * (1 / light.userData.hz);
        light.userData.rect = rect;

        // add to scene, list
        light.add(rect);
        rectLightsGroup.add(light);
        this.rectLights.push(light);
      }
    }
    scene.add(rectLightsGroup);
    */
  }

  update(delta) {
    /*
    this.rectLights.forEach(light => {
      light.userData.age += delta;
      const t = Math.sin(light.userData.age * light.userData.hz * Math.PI * 2) * 0.5 + 0.5;
      light.userData.rect.material.opacity = t;
      light.intensity = t * light.userData.amp;
    });
    */
  }
}

export default Lighting;