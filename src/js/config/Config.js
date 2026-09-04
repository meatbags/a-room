/** Config */

import * as THREE from 'three';

const getPointLight = () => {
  return null;
  const light = new THREE.PointLight(0x0000FF, 0.25, 10);
  //light.castShadow = true;
  return light;
}

export default {
  Camera: {
    fov: 70,
    near: 0.1,
    far: 10000,
  },
  Environment: {
    textures: [{
      name: 'envMap',
      src: './images/env/default-grey-contrast.jpg',
      props: {
        mapping: THREE.EquirectangularReflectionMapping,
        colorSpace: THREE.SRGBColorSpace
      }
    }],
    envMapDefault: 'envMap',
    envMapIntensityDefault: 0.1, // 0.45,
  },
  Graphics: {
    fog: {
      hex: 0x444249,
      density: 0.0125,
    },
    backgroundBlurriness: 0,
    backgroundRotation: 0.002 * Math.PI,
    skybox: {
      src: './images/env/skybox.jpg',
      props: {
        mapping: THREE.EquirectangularReflectionMapping,
        colorSpace: THREE.SRGBColorSpace
      }
    },
  },
  History: {
    disabled: false,
  },
  Lighting: {
    zones: {
      default: {
        type: 'default',
        lighting: {
          ambient: { type: 'ambient', intensity: 0.5 },
          directional: { type: 'directional', intensity: 0.35, position: [-1, 1, -1] },
          directional_shadow: { 
            type: 'directional', 
            intensity: 0.375, 
            position: [-1, 1, -1],
            shadow: {
              mapSize: 4096,
              cameraSize: 5,
              cameraNear: 0.5,
              cameraFar: 512,
              csmMaxFar: 64,
              csmCascades: 4,
              csmFade: true,
              csmMode: 'practical', // practical, uniform, logarithmic
            }
          },
          point: { type: 'point', color: 0x0000FF, intensity: 10, position: [0, 3, 0] },
          rectArea: { 
            type: 'rectarea', color: 0xFFFFFF, intensity: 5, width: 1.25, height: 0.3125, 
            position: [-48, 14.75, -2.875], lookAt: [-48, 0, -2.75] },
          rectArea2: { 
            type: 'rectarea', color: 0xFFFFFF, intensity: 5, width: 1.25, height: 0.3125, 
            position: [-48, 14.75, 2.875], lookAt: [-48, 0, 2.75] },
          envMapIntensity: 0.35,
        }
      },
    }
  },
  MainLoop: {
    fixedDelta: false,
    warmup: false,
    // warmupFrames: 15,
  },
  Physics: {
    gravity: -2.3,
    stepHeight: 0.5,
    maxSlopeClimb: Math.PI * 0.3,
    minSlopeClimb: Math.PI * 0.3,
  },
  Player: {
    height: 1.8,
    speed: 3.0,
    speedRunning: 6.0,
    speedNoclip: 64,
    shape: 'cylinder',
    positionDampingVertical: 0.2,
    jumpEnabled: false,
    crouchEnabled: false,
    playerLight: getPointLight(),
  },
  Renderer: {
    localClippingEnabled: false,
    useWebGPU: true,
    useShadows: true,
    width: 1280,
    height: 640,
  },
};
