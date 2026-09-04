/** SceneNode */

import Config from '../config/Config';
import { SceneNode, SpotLightFog, Blend } from 'engine';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
// import { CSMShadowNode } from '../shader/CSMShadowNode.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode';
import * as WebGPU from 'three/webgpu';
import * as THREE from 'three';
import LOD from '../util/LOD';

class Lighting extends SceneNode {
  static lodRadius = 20;
  static lodFadeDistance = 10;

  constructor() {
    super({ name: 'Lighting' });

    // container
    this._lods = [];
  }

  /**
   * Initialise.
   */
  _init() {
    // lights
    this._initLights();

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
  }

  /**
   * Initialise lighting.
   */
  _initLights() {
    const scene = SceneNode.getSceneNode('Scene').getScene();

    // set up lighting
    this.lights = {};
    this.shadowLights = [];

    for (const k in Config.Lighting.lights) {
      // create light
      let light = null;
      const conf = Config.Lighting.lights[k];

      // ambient
      if (conf.type === 'ambient') {
        light = new THREE.AmbientLight(conf.color ?? 0xFFFFFF, conf.intensity ?? 0);

      // directional
      } else if (conf.type === 'directional') {
        light = new THREE.DirectionalLight(conf.color ?? 0xFFFFFF, conf.intensity ?? 0);
        const offset = new THREE.Vector3().fromArray(conf.position ?? [0, 1, 0]);
        light.position.copy(offset);
        light.userData.offset = offset;

      // point
      } else if (conf.type === 'point') {
        light = new THREE.PointLight(conf.color ?? 0xFFFFFF, conf.intensity ?? 0, conf.distance ?? 100, conf.decay ?? 2);
        light.position.copy(new THREE.Vector3().fromArray(conf.position ?? [0, 1, 0]));

      // rectarea
      } else if (conf.type === 'rectarea') {
        if ( ! this._rectAreaInitialised ) {
          WebGPU.RectAreaLightNode.setLTC( RectAreaLightTexturesLib.init() );
          this._rectAreaInitialised = true;
        }

        // light
        light = new WebGPU.RectAreaLight(
          conf.color ?? 0xFFFFFF,
          conf.intensity ?? 1,
          conf.width ?? 1,
          conf.height ?? 1,
        );
        light.position.copy(new THREE.Vector3().fromArray(conf.position ?? [0, 1, 0]));
        light.lookAt(new THREE.Vector3().fromArray(conf.lookAt ?? [0, 0, 0]));
      }

      // create shadow / csm
      if (light && conf.shadow) {
        light.castShadow = true;
        light.shadow.mapSize.width = conf.shadow.mapSize ?? 512;
        light.shadow.mapSize.height = conf.shadow.mapSize ?? 512;
        light.shadow.radius = conf.shadow.radius ?? 1;
        light.shadow.intensity = conf.shadow.intensity ?? 1;
        light.shadow.bias = conf.shadow.bias ?? 0;
        light.shadow.camera.left = -(conf.shadow.cameraSize ?? 10);
        light.shadow.camera.right = (conf.shadow.cameraSize ?? 10);
        light.shadow.camera.top = (conf.shadow.cameraSize ?? 10);
        light.shadow.camera.bottom = -(conf.shadow.cameraSize ?? 10);
        light.shadow.camera.near = conf.shadow.cameraNear ?? 0.5;
        light.shadow.camera.far = conf.shadow.cameraFar ?? 1000;
        light.shadow.shadowNode = new CSMShadowNode(light, {
          cascades: conf.shadow.csmCascades ?? 3,
          maxFar: conf.shadow.csmMaxFar ?? 100,
          mode: conf.shadow.csmMode ?? 'practical'
        });
        light.shadow.shadowNode.fade = conf.shadow.csmFade ?? false;
        this.shadowLights.push(light);
      }

      // add to scene
      if (light) {
        this.lights[k] = light;
        scene.add(light);
        if (conf.type === 'directional') {
          scene.add(light.target);
        }

        // create LOD
        if (light.isPointLight || light.isRectAreaLight) {
          const lod = new LOD(light.position);
          lod.add(light, 0, Lighting.lodRadius, Lighting.lodFadeDistance);
          this._lods.push( lod );
        }
      }
    }
  }

  /**
   * On camera move callback.
   */
  _onCameraMove(p) {
    // move directional shadow light camera
    this.shadowLights.forEach(light => {
      light.target.position.copy(p);
      const dist = light.shadow.camera.far / 2;
      light.position.set(
        p.x + light.userData.offset.x * dist,
        p.y + light.userData.offset.y * dist,
        p.z + light.userData.offset.z * dist
      );

      // update frustums
      if (light.shadow.shadowNode.camera) {
        light.shadow.shadowNode.updateFrustums();
      }
    });
  }
}

export default Lighting;