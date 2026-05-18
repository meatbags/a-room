/** SceneNode */

import Config from '../config/Config';
import { SceneNode, SpotLightFog, Blend } from 'engine';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';
// import { CSMShadowNode } from '../shader/CSMShadowNode.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode';
import * as WebGPU from 'three/webgpu';
import * as THREE from 'three';

class LightingZone {
  static zones = [];
  static defaultZone = null;

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

          const allowedKeys = ['intensity'];

          // set a -> b values
          for (const key in a.lighting) {
            if (typeof a.lighting[key] === 'object') {
              lighting[key] = {};
              for (const k in a.lighting[key]) {
                if (!allowedKeys.includes(k)) continue;
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
                if (!allowedKeys.includes(k)) continue;
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

  /** add default lighting zone */
  static addDefaultZone(name, lighting) {
    const zone = { name, lighting, callback: () => false };
    LightingZone.zones.push(zone);
    LightingZone.defaultZone = zone;
  }

  /** get lighting by position */
  static getZoneLighting(position) {
    for (let i=0; i<LightingZone.zones.length; i++) {
      if (LightingZone.zones[i].callback(position)) {
        return LightingZone.zones[i];
      }
    }
    return LightingZone.defaultZone;
  }
}

class Lighting extends SceneNode {
  constructor() {
    super({ name: 'Lighting' });

    // props
    this._lightingConfig = null;
  }

  _init() {
    // lights
    this._initLights();

    // create lighting zone/s
    for (const key in Config.Lighting.zones) {
      const zone = Config.Lighting.zones[key];
      if (zone.type === 'default') {
        LightingZone.addDefaultZone(key, zone.lighting);
      } else if (zone.type === 'transition') {
        LightingZone.addTransitionZone(key, zone.from, zone.to, zone.callback, zone.callbackT);
      } else {
        LightingZone.addZone(key, zone.lighting, zone.callback);
      }
    }

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

  _initLights() {
    const scene = SceneNode.getSceneNode('Scene').getScene();

    // setup lighting
    this.lights = {};
    this.shadowLights = [];
    for (const key in Config.Lighting.zones) {
      for (const k in Config.Lighting.zones[key].lighting) {
        if (this.lights[k]) continue;

        // create light
        let light = null;
        const conf = Config.Lighting.zones[key].lighting[k];

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
            mode: conf.shadow.csmMode ?? 'practical',
            fade: conf.shadow.csmFade ?? false,
          });;
          this.shadowLights.push(light);
        }

        // add to scene
        if (light) {
          this.lights[k] = light;
          scene.add(light);
          if (conf.type === 'directional') {
            scene.add(light.target);
          }
        }
      }
    }
  }

  _initLightingZones() {
    // indoors dark zone 1
    /*
    const origin = new THREE.Vector3();
    const dsqr = Math.pow(6.25, 2);

    LightingZone.addZone(
      'indoors_dark', {
        ambient: { intensity: 0.025 },
        directionalConstant: { intensity: 0.05 },
        directional: { intensity: 0.375 },
        point: { intensity: 1.0 },
        envMapIntensity: 0.125,
      },
      p => {
        return Math.pow(origin.x - p.x, 2) + Math.pow(origin.z - p.z, 2) < dsqr;
      }
    );

    // indoors to outdoors
    const box1 = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1.35, -7.5), 
      new THREE.Vector3(1.5, 3, 3)
    );
    const zMin = -7.5 + 1.5;
    const zMax = -7.5 - 1.5;
    LightingZone.addTransitionZone(
      'indoors_dark_to_outdoors',
      'indoors_dark',
      'outdoors',
      p => box1.containsPoint(p),
      p => {
        return (p.z - zMin) / (zMax - zMin);
      },
    );
    */
  }

  /** on camera move */
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
    if (!this._lightingConfigInitialised) {
      this._lightingConfigInitialised = true;
      setTimeout(() => {
        this._onCameraMove(SceneNode.getSceneNode('Camera').getCamera().position);
      }, 250);
    }

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
        const target = envMapIntensity * (mat.metalness ?? 0);
        const di = target - mat.envMapIntensity;
        mat.envMapIntensity += di * blend;
        if (Math.abs(di) >= eps) {
          done = false;
        } else {
          mat.envMapIntensity = target;
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