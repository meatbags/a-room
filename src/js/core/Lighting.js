/** SceneNode */

import { SceneNode, SpotLightFog, Blend } from 'engine';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
// import { CSMShadowNode } from '../shader/CSMShadowNode.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode';
import * as WebGPU from 'three/webgpu';
import * as THREE from 'three';

class LightingZone {
  static zones = [];

  /** add zone */
  static addZone(name, lighting, callback) {
    LightingZone.zones.push({ name, lighting, callback });
  }

  /**
   * Add lighting transition zone. 
   * 
   * @param { string } name - name
   * @param { string } from - name of from zone (t=0)
   * @param { string } to - name of to zone (t=1)
   * @param { string } callback - in zone callback f(position)
   * @param { string } callbackT - get t callback f(position)
   */
  static addTransitionZone(name, from, to, callback, callbackT) {
    const lighting = {};
    LightingZone.zones.push({
      name,
      lighting,
      callback: p => {
        let res = callback(p);
        if (res) {
          let t = callbackT(p);
          let a = LightingZone.zones.find(z => z.name === from);
          let b = LightingZone.zones.find(z => z.name === to);
          let justSet = {};

          if (!a || !b) {
            console.warn('No lighting zone found', from, a, to, b);
          }

          // set a -> b values
          for (const key in a.lighting) {
            if (typeof a.lighting[key] === 'object') {
              lighting[key] = {};
              for (const k in a.lighting[key]) {
                const bVal = b.lighting[key] && b.lighting[key][k] !== undefined ? b.lighting[key][k] : 0;
                lighting[key][k] = Blend(a.lighting[key][k], bVal, t);
                justSet[`${key};${k}`] = true;
              }
            } else {
              const bVal = b.lighting[key] ?? 0;
              lighting[key] = Blend(a.lighting[key], bVal, t);
              justSet[key] = true;
            }
          }

          // set b -> a remaining values
          for (const key in b.lighting) {
            if (typeof b.lighting[key] === 'object') {
              if (!lighting[key]) lighting[key] = {};
              for (const k in b.lighting[key]) {
                if (justSet[`${key};${k}`]) continue;
                const aVal = a.lighting[key] && a.lighting[key][k] !== undefined ? a.lighting[key][k] : 0;
                lighting[key][k] = Blend(aVal, b.lighting[key][k], t);
              }
            } else {
              if (justSet[key]) continue;
              const aVal = a.lighting[key] ?? 0;
              lighting[key] = Blend(aVal, b.lighting[key], t);
            }
          }
        }
        return res;
      },
      isTransitionZone: true,
    })
  }

  /** get lighting by position */
  static getZoneLighting(position) {
    for (let i=0; i<LightingZone.zones.length; i++) {
      if (LightingZone.zones[i].callback(position)) {
        return LightingZone.zones[i];
      }
    }
    return null;
  }
}

class Lighting extends SceneNode {
  constructor() {
    super({ name: 'Lighting' });

    // props
    this._lightingConfig = null;
  }

  _init() {
    // add lights
    const scene = SceneNode.getSceneNode('Scene').getScene();
    this._lights = {};
    this._lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.025);
    scene.add(this._lights.ambient);

    // directional light constant
    const offset = new THREE.Vector3(-1, 1, -1);
    this._lights.directionalConstant = new THREE.DirectionalLight(0xFFFFFF, 0.0);
    this._lights.directionalConstant.position.copy(offset);
    scene.add(this._lights.directionalConstant);

    // directional light + cascade shadow map
    this._lights.directional = new THREE.DirectionalLight(0xFFFFFF, 0.0);
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
    this._lights.directional.shadow.intensity = 1.5;
    this._lights.directional.shadow.bias = 0;
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

    this._lights.point = new THREE.PointLight(0x00DDFF, 1.5, 5, 2);
    this._lights.point.position.set(0, 3.4065, -5.8);
    scene.add(this._lights.point);

    // create lighting zone/s
    this._initLightingZones();

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

  _initLightingZones() {
    // indoors dark zone 1
    const origin = new THREE.Vector3();
    const dsqr = Math.pow(6.25, 2);

    LightingZone.addZone(
      'indoors_dark', {
        ambient: { intensity: 0.025 },
        directionalConstant: { intensity: 0 },
        directional: { intensity: 0 },
        point: { intensity: 1.5 },
        envMapIntensity: 0.02,
      },
      p => {
        return Math.pow(origin.x - p.x, 2) + Math.pow(origin.z - p.z, 2) < dsqr;
      }
    );

    // indoors to outdoors
    const box1 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1.35, -8), 
      new THREE.Vector3(1.5, 3, 4)
    );
    const zMin = -8 + 2;
    const zMax = -8 - 2;
    LightingZone.addTransitionZone(
      'indoors_dark_to_outdoors',
      'indoors_dark',
      'outdoors',
      p => box1.containsPoint(p),
      p => {
        return (p.z - zMin) / (zMax - zMin);
      },
    );

    // outdoors -- default
    LightingZone.addZone(
      'outdoors', {
        ambient: { intensity: 0.05 },
        directionalConstant: { intensity: 0.2 },
        directional: { intensity: 0.2 },
        envMapIntensity: 0.2,
      },
      p => true,
    );
  }

  /** on camera move */
  _onCameraMove(p) {
    // move directional shadow light camera
    this._lights.directional.target.position.copy(p);
    const dist = this._lights.directional.shadow.camera.far / 2;
    this._lights.directional.position.set(
      p.x + this._lights.directional.userData.offset.x * dist,
      p.y + this._lights.directional.userData.offset.y * dist,
      p.z + this._lights.directional.userData.offset.z * dist
    );

    // update frustums
    if (this._lights.directional.shadow.shadowNode.camera) {
      this._lights.directional.shadow.shadowNode.updateFrustums();
    }
    
    // set lighting zone config
    const conf = LightingZone.getZoneLighting(p);
    if (conf && (this._lightingConfig === null || conf.name !== this._lightingConfig.name)) {
      this._lightingConfig = conf;
      this._envMaps = [];
      const tmp = {};
      SceneNode.getSceneNode('Scene').getScene().traverse(obj => {
        if (
          obj.material && 
          obj.material.envMap && 
          obj.material.envMapIntensity !== undefined &&
          !tmp[obj.material.uuid]
        ) {
          this._envMaps.push(obj.material);
          tmp[obj.material.uuid] = true;
        }
      });
      this._lightingNeedsUpdate = true;

    // transition zone -- force update
    } else if (conf && conf.isTransitionZone) {
      this._lightingNeedsUpdate = true;
    }
  }

  _update( /** delta */ ) {
    if (this._lightingConfig && this._lightingNeedsUpdate) {
      const lighting = this._lightingConfig.lighting;
      const eps = 0.005;
      const blend = 0.1;
      let done = true;

      // adjust lights
      for (const key in this._lights) {
        const light = this._lights[key];
        const intensity = lighting[key] && lighting[key].intensity !== undefined
          ? lighting[key].intensity
          : 0;
        const di = intensity - light.intensity;
        light.intensity += di * blend;
        if (Math.abs(di) >= eps) {
          done = false;
        } else {
          light.intensity = intensity;
        }
      }

      // adjust envmap intensity
      const envMapIntensity = lighting.envMapIntensity ?? 0;
      this._envMaps.forEach(mat => {
        const di = envMapIntensity - mat.envMapIntensity;
        mat.envMapIntensity += di * blend;
        if (Math.abs(di) >= eps) {
          done = false;
        } else {
          mat.envMapIntensity = envMapIntensity;
        }
      });
      
      // transition complete flag
      if (done) {
        this._lightingNeedsUpdate = false;
      }
    }
  }
}

export default Lighting;