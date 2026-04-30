/** Particles */

import { SceneNode } from 'engine';
// import DustPointsMaterial from './DustPointsMaterial';
import { SpriteNodeMaterial } from 'three/webgpu';
import { atan, Fn, color, NodeUpdateType, uniform, vec4, passTexture, uv, logarithmicDepthToViewZ, viewZToPerspectiveDepth, getViewPosition, screenCoordinate, float, sub, fract, dot, vec2, rand, vec3, Loop, mul, PI, cos, sin, uint, cross, acos, sign, pow, luminance, If, max, abs, Break, sqrt, HALF_PI, div, ceil, shiftRight, convertToTexture, bool, getNormalFromDepth, interleavedGradientNoise } from 'three/tsl';
import * as THREE from 'three';

class Dust extends SceneNode {
  constructor() {
    super({ name: 'Dust' });

    // props
    this.time = 0;
    this._disabled = false;
  }

  /** @override */
  _init() {
    const count = 300;
    const position = new THREE.Vector3(0, 0, 0);
    const size = new THREE.Vector3(10, 10, 10);
    const particleSize = 0.008;
    const speed = 0.01;

    // create points material
    /*
    this.pointsMaterial = new DustPointsMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.2,
      alphaMap: new THREE.TextureLoader().load('./images/particles/dust.jpg'),
      depthWrite: false,
      size: particleSize,
      sizeAttenuation: true,
      fog: false
    });
    this.pointsMaterial.setUniform('uSize', size);
    this.pointsMaterial.setUniform('uSpeed', speed);
    */

    // create points
    const vertices = [];
    for (let i=0; i<count; i++) {
      vertices.push(
        (Math.random() * 2 - 1) * size.x / 2,
        (Math.random() * 2 - 1) * size.y / 2,
        (Math.random() * 2 - 1) * size.z / 2
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const spriteMaterial = new SpriteNodeMaterial();
    spriteMaterial.blending = THREE.AdditiveBlending;
    spriteMaterial.scaleNode = vec2(0.001, 0.001);
    spriteMaterial.positionNode = geo.attributes.position;
    
    const spriteMat = new THREE.SpriteMaterial({
      sizeAttenuation: true,
    });
    const mesh = new THREE.InstancedMesh(geo, spriteMat, count);
    mesh.scale.set(0.01, 0.01, 0.01);
    this._addToScene(mesh);
    //this.points = new THREE.Points(geo, this.pointsMaterial);
    //this.points.position.copy(position);

    // render before transparent mats
    // this.points.renderOrder = 1;

    // follow camera
    this._addEventListenerToObject(
      this._getSceneNode('Camera'), 'move', p => {
        //this.points.position.copy(p);
        //this.points.material.setUniform('uPosition', p);
      });

    // add to scene
    //this._addToScene(this.points);
  }

  // disable
  disable() {
    this._disabled = true;
    this.points.visible = false;
  }

  // enable
  enable() {
    this._disabled = false;
    this.points.visible = true;
  }

  /** update */
  _update(delta) {
    if (this._disabled) return;

    this.time += delta;
    if (this.pointsMaterial) {
      this.pointsMaterial.setUniform('uTime', this.time);
    }
  }
}

export default Dust;
