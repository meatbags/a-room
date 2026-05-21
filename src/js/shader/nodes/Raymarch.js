/** Raymarch */

import { varying, float, vec3, min, max, mx_noise_vec3, triNoise3D, cameraPosition, positionWorld, Loop, If, Break, length } from 'three/tsl';

const MAX_ITERATIONS = 100;
const RAY_STEP_MIN = 0.05;

export const Raymarch = ( steps, rayMin, rayMax, callback ) => {
  const vOrigin = varying( cameraPosition );
  const vDirection = varying( positionWorld.sub( vOrigin ) );
  const rayDir = vDirection.normalize();
  const start = rayMin.toVar(); // float(rayMin).add(rayOffset.x);
  const stop = min(rayMax, length(vDirection)).toVar()
  const delta = max(RAY_STEP_MIN, stop.sub(start).abs().div(steps)).toVar();
  const rayOffset = mx_noise_vec3( positionWorld.mul(100) ).fract().mul(delta).toVar();
  start.addAssign( rayOffset );
  const positionRay = vec3( vOrigin.add( start.mul( rayDir ) ) ).toVar();
  const distanceTravelled = rayOffset.toVar();
  const iter = float(0).toVar();
  
  Loop( { type: 'float', start: start, end: stop, update: delta }, () => {
    // do callback
    callback( {
      positionRay,
      distanceTravelled
    });

    // update ray, check done
    positionRay.addAssign( rayDir.mul( delta ) );
    distanceTravelled.addAssign( delta );
    iter.addAssign(1);
    If( iter.greaterThanEqual(MAX_ITERATIONS), () => {
      Break();
    });
  });
};