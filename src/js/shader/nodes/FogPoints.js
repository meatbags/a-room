/** FogPoints */

import { float, atan, max, length, clamp, dot, vec3, vec4, Fn, cameraPosition, positionWorld } from 'three/tsl';

const density = 0.5;

export const FogPoints = Fn(([ sphere=vec4(1.8, 1, -32, 9) ]) => {
  const a = cameraPosition;
  const b = positionWorld;
  const alpha = float(1);

  // segment -> light nearest p
  const af = sphere.xyz.sub(a).toVar();
  const ab = b.sub(a).toVar();
  const t = clamp((dot(ab, af).div(max(dot(ab, ab), 0.0001))), 0, 1);
  const nearest = a.add(ab.mul(t));

  // distance
  const fD = max(length(sphere.xyz.sub(nearest)), 0.0001);
  const fA = length(nearest.sub(a)).mul(-1);
  const fB = length(nearest.sub(b));

  // scale density
  fD.mulAssign( float(1).div(density) );

  alpha.assign( 
    clamp(
      atan(fB.div(fD)).div(fD).sub( atan(fA.div(fD)).div(fD) ), 0, 1
    ).oneMinus()
  );

  return alpha;
});