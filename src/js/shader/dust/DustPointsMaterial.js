/** DustPointsMaterial */

import { SpriteNodeMaterial } from 'three/webgpu';
import { atan, Fn, color, NodeUpdateType, uniform, vec4, passTexture, uv, logarithmicDepthToViewZ, viewZToPerspectiveDepth, getViewPosition, screenCoordinate, float, sub, fract, dot, vec2, rand, vec3, Loop, mul, PI, cos, sin, uint, cross, acos, sign, pow, luminance, If, max, abs, Break, sqrt, HALF_PI, div, ceil, shiftRight, convertToTexture, bool, getNormalFromDepth, interleavedGradientNoise } from 'three/tsl';
import { AdditiveBlending, PointsMaterial, Vector3 } from 'three';
import { vertex, fragment } from './dust-points.glsl.js';

class DustPointsMaterial extends SpriteNodeMaterial {
  constructor(props = {}) {
    super(props);
    
    this._uniforms = {
      uTime: uniform(0),
      uSize: uniform(vec3(1, 1, 1)),
      uPosition: uniform(vec3()),
      uSpeed: uniform(1),
      uDirection: uniform(vec3(1, 0, 0)),
    };
  }

  onBeforeCompile(shader) {
    // set uniforms
    shader.uniforms = { ...shader.uniforms, ...this._uniforms };

    // override shaders
    shader.vertexShader = vertex;
    shader.fragmentShader = fragment;
  }

  setUniform(key, value) {
    if (!this._uniforms[key]) return;
    if (typeof this._uniforms[key].value === 'number') {
      this._uniforms[key].value = value;
    } else if (this._uniforms[key].value.isVector3) {
      this._uniforms[key].value.copy(value);
    }
  }
}

export default DustPointsMaterial;
