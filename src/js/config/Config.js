/** Config */

import * as THREE from 'three';

export default {
  Camera: {
    fov: 60,
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
    envMapIntensityDefault: 0.0,
  },
  Graphics: {
    fog: {
      hex: 0x888888,
      density: 0.0225,
    },
    backgroundBlurriness: 0,
    skybox: {
      src: './images/env/default-skybox.jpg',
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
          ambient: { type: 'ambient', intensity: 0.025 },
          directional: { type: 'directional', intensity: 0.05, position: [-1, 1, -1] },
          directional_shadow: { 
            type: 'directional', 
            intensity: 0.375, 
            position: [-1, 1, -1],
            shadow: {
              mapSize: 4096,
              cameraSize: 5,
              cameraNear: 0.5,
              cameraFar: 256,
              csmMaxFar: 20,
              csmCascades: 4,
              csmFade: true,
              csmMode: 'practical', // practical, uniform, logarithmic
            }
          },
          envMapIntensity: 0.1,
        }
      },
    }
  },
  Physics: {
    stepHeight: 0.5,
    maxSlopeClimb: Math.PI * 0.3,
    minSlopeClimb: Math.PI * 0.3,
  },
  Player: {
    height: 1.75,
    speed: 2.25,
    speedRunning: 4.75,
    speedNoclip: 20,
    shape: 'cylinder',
    positionDampingVertical: 0.2,
    jumpEnabled: false,
    playerLight: new THREE.PointLight(0xDDFFFF, 0.25, 5),
  },
  Renderer: {
    localClippingEnabled: false,
    useWebGPU: true,
    useShadows: true,
  },
};
