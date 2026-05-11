/** Config */

import * as THREE from 'three';

export default {
  Renderer: {
    localClippingEnabled: false,
    useWebGPU: true,
  },
  Player: {
    speed: 2.1,
    height: 1.75,
    speedRunning: 4.5,
    speedNoclip: 20,
    shape: 'cylinder',
    positionDampingVertical: 0.2,
    jumpEnabled: false,
    crouchEnabled: false,
    playerLight: null, // new THREE.PointLight(0xEEEEFF, 0.15),
  },
  Physics: {
    stepHeight: 0.5,
  },
  Camera: {
    fov: 60,
    near: 0.1,
    far: 10000,
  },
  Graphics: {
    fog: {
      hex: 0x222222,
      density: 0.002,
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
  Environment: {
    textures: [{
      name: 'envMap',
      src: './images/env/default-grey.jpg',
      props: {
        mapping: THREE.EquirectangularReflectionMapping,
        colorSpace: THREE.SRGBColorSpace
      }
    }],
    envMapDefault: 'envMap',
    envMapIntensityDefault: .25,
  }
};
