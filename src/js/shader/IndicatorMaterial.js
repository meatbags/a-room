/** IndicatorMaterial */

import { MeshStandardNodeMaterial } from 'three/webgpu';
import { atan, Fn, color, NodeUpdateType, uniform, vec4, passTexture, uv, logarithmicDepthToViewZ, viewZToPerspectiveDepth, getViewPosition, screenCoordinate, float, sub, fract, dot, vec2, rand, vec3, Loop, mul, PI, cos, sin, uint, cross, acos, sign, pow, luminance, If, max, abs, Break, sqrt, HALF_PI, div, ceil, shiftRight, convertToTexture, bool, getNormalFromDepth, interleavedGradientNoise } from 'three/tsl';

const IndicatorMaterial = (n=3, c0=0xFF0000, c1=0xFF0000, c2=0xFF0000, c3=0xFF0000) => {
  const mat = new MeshStandardNodeMaterial();
  
  // const numQuadrants = uniform(3);
  const pi = Math.PI;
  const pi2 = float( Math.PI * 2 );
  const angleStart = float( Math.PI * -1 );
  const uvNode = uv();
  const q0 = uniform(color(c0));
  const q1 = uniform(color(c1));
  const q2 = uniform(color(c2));
  const q3 = uniform(color(c3));
  const numQuadrants = uniform(float(n));
  const uvCentre = vec2(0.5, 0.5);

  mat.uniforms = {
    c: [ q0, q1, q2, q3 ]
  };

  const getEmissive = Fn(() => {
    const res = color();
    const angle = atan(uvCentre.x.sub(uvNode.y), uvCentre.y.sub(uvNode.x));
    const offset = pi2.div(numQuadrants);
    If( angle.lessThan( angleStart.add(offset) ), () => { res.assign(q0); } )
    .ElseIf( angle.lessThan( angleStart.add(offset.mul(2)) ), () => { res.assign(q1); } )
    .ElseIf( angle.lessThan( angleStart.add(offset.mul(3)) ), () => { res.assign(q2); } )
    .Else(() => { res.assign(q3); })
    return res;
  });
  
  mat.emissiveNode = getEmissive();

  return mat;
};

export default IndicatorMaterial;

/*
const emissivemap_pars_fragment = `
#include <emissivemap_pars_fragment>

uniform int num_quadrants;
uniform vec3 quadrant_0;
uniform vec3 quadrant_1;
uniform vec3 quadrant_2;
uniform vec3 quadrant_3;

vec3 get_emissive(vec2 uv) {
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float offset = PI * 2.0 / (float)(num_quadrants);
  if (angle < -PI + offset) return quadrant_0;
  if (angle < -PI + offset * 2.0) return quadrant_1;
  if (angle < -PI + offset * 3.0) return quadrant_2;
  if (angle < -PI + offset * 4.0) return quadrant_3;
}

`;

const emissive = `
  vec3 totalEmissiveRadiance = get_emissive(vUv);
`;

class IndicatorMaterial extends MeshStandardNodeMaterial {
  constructor(props={}) {
    super();

    this.isIndicatorMaterial = true;

    // defines
    this.defines = {
      'STANDARD': '',
      'PHYSICAL': '',
    };

    this._uniforms = {
      num_quadrants: { value: 3 },
      quadrant_0: { value: new Color(0xFF0000) },
      quadrant_1: { value: new Color(0x00FF00) },
      quadrant_2: { value: new Color(0x0000FF) },
      quadrant_3: { value: new Color(0x0000FF) },
    };

    this.setValues(props);
  }

  onBeforeCompile(shader) {
    shader.uniforms = { ...shader.uniforms, ...this._uniforms };
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_pars_fragment>', emissivemap_pars_fragment);
    shader.fragmentShader = shader.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', emissive);
  }

  copy(source) {
    super.copy(source);
    return this;
  }
}
*/