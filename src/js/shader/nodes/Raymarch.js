/** Raymarch */

import { varying, float, vec3, min, max, mx_noise_vec3, cameraPosition, positionWorld, Loop, If, Break, length } from 'three/tsl';

const MAX_ITER = 100;
const MAX_RAY_LENGTH = 10;
const RAY_START = 0;
const RAY_STEP_MIN = 0.05;

export const Raymarch = ( steps, callback ) => {
  const vOrigin = varying( cameraPosition );
  const vDirection = varying( positionWorld.sub( vOrigin ) );
  const rayDir = vDirection.normalize();
  const rayOffset = mx_noise_vec3( positionWorld.mul(100) ).fract().mul(0.1).toVar();
  const start = float(RAY_START).add(rayOffset.x);
  const stop = min(MAX_RAY_LENGTH, length(vDirection)).toVar()
  // const inc = vec3(rayDir.abs().reciprocal()).toVar();
  // const delta = min(stop.sub(start).abs().div(steps), float( RAY_DEFAULT_STEP )).toVar(); 
  const delta = max(RAY_STEP_MIN, stop.sub(start).abs().div(steps)).toVar();
  // float( min( inc.x, min( inc.y, inc.z ) ) ).div(steps).toVar();
  const positionRay = vec3( vOrigin.add( start.mul( rayDir ) ) ).toVar();
  const distanceTravelled = delta.toVar();
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
    If (
      iter.greaterThanEqual(MAX_ITER)
        .or(distanceTravelled.greaterThanEqual(MAX_RAY_LENGTH)
    ), () => {
      Break();
    });
  });
};