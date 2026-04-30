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
    speedRunning: 3.8,
    shape: 'cylinder',
    playerLight: null,
  },
  Physics: {
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
    }
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
