/** SceneNode */

import { SceneNode, SpotLightFog } from 'engine';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
// import { CSMShadowNode } from '../shader/CSMShadowNode.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode';
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
    this._lights.ambient = new THREE.AmbientLight(0x88FFFF, 0.1);
    scene.add(this._lights.ambient);

    // directional light constant
    const offset = new THREE.Vector3(-1, 1, -1);
    this._lights.directionalConstant = new THREE.DirectionalLight(0xFFFFFF, 0.25);
    this._lights.directionalConstant.position.copy(offset);
    scene.add(this._lights.directionalConstant);

    // directional light + cascade shadow map
    this._lights.directional = new THREE.DirectionalLight(0xFFFFFF, 0.25);
    this._lights.directional.position.copy(offset);
    const size = 5;
    const far = 512;
    const maxFar = 40;
    const res = 2048;
    const cascades = 4;
    const mode = 'uniform'; // practical, logarithmic, uniform
    this._lights.directional.userData.offset = offset;
    this._lights.directional.castShadow = true;
    this._lights.directional.shadow.mapSize.width = res;
    this._lights.directional.shadow.mapSize.height = res;
    this._lights.directional.shadow.radius = 1;
    this._lights.directional.shadow.intensity = 1;
    this._lights.directional.shadow.bias = 0.00005;
    this._lights.directional.shadow.camera.left = -size;
    this._lights.directional.shadow.camera.right = size;
    this._lights.directional.shadow.camera.top = size;
    this._lights.directional.shadow.camera.bottom = -size;
    this._lights.directional.shadow.camera.near = 0.5;
    this._lights.directional.shadow.camera.far = far;
    const csm = new CSMShadowNode(this._lights.directional, {
      cascades: cascades,
      maxFar: maxFar,
      mode: mode
    });
    this._lights.directional.shadow.shadowNode = csm;
    scene.add(this._lights.directional, this._lights.directional.target);

    this._lights.point = new THREE.PointLight(0x00FFFF, 2, 3, 2);
    this._lights.point.position.set(0, 3.5, -5.5);
    //this._lights.point.castShadow = true;
    scene.add(this._lights.point);

    // set directional light on camera move
    SceneNode.getSceneNode('Camera').addEventListener('move', p => this._onCameraMove(p));

    // callback
    this._updateFrustumsOnce = () => {
      if (this._lights.directional.shadow.shadowNode.camera) {
        const p = SceneNode.getSceneNode('Camera').getCamera().position;
        this._onCameraMove(p);
        this._updateFrustumsOnce = null;
      }
    };

    /*
    const spotlight = new SpotLightFog(0x00FFFF, 1, 15, Math.PI/3, 0.5, 2, 0.05);
    spotlight.position.set(0, 3.5,  -5.5);
    const spotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1), 
      new THREE.MeshBasicMaterial({color:0xFFFFFF})
    );
    spotMesh.position.copy(spotlight.position);
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.set(1024, 1024);
    scene.add(spotlight, spotlight.target);
    scene.add(spotMesh);
    */

    /*
    const spotlight = new SpotLightFog(0xFFFFFF, 5, 5, Math.PI/4, 0.5, 2, 0.25);
    spotlight.position.set(0, 5, 0);
    const spotLightSrc = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
    spotLightSrc.position.copy(spotlight.position);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight, spotlight.target);
    scene.add(spotLightSrc);
    */

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

  /** on camera move */
  _onCameraMove(p) {
    this._lights.directional.target.position.copy(p);
    const dist = this._lights.directional.shadow.camera.far / 2;
    this._lights.directional.position.set(
      p.x + this._lights.directional.userData.offset.x * dist,
      p.y + this._lights.directional.userData.offset.y * dist,
      p.z + this._lights.directional.userData.offset.z * dist
    );
    if (this._lights.directional.shadow.shadowNode.camera) {
      this._lights.directional.shadow.shadowNode.updateFrustums();
    }
  }

  _update( /** delta */ ) {
    if (this._updateFrustumsOnce) {
      this._updateFrustumsOnce();
    }
  }
}

export default Lighting;