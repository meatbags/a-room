/** Config */

import * as THREE from 'three';

export default {
  Renderer: {
    localClippingEnabled: false,
    useWebGPU: true,
    useShadows: true,
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
  }
};
