/** RaymarchingSphere */

import {
  Fn, If, Loop, Break,
  float, vec3, vec4,
  varying, modelPosition, modelRadius, cameraPosition, 
  modelWorldMatrixInverse, positionGeometry, positionWorld,
  dot, length, min, max, sqrt
} from 'three/tsl';

export const RaySphereIntersectDistance = Fn(([
  origin,
  dir,
  centre,
  radius
]) => {
  const a = dot(dir, dir).toVar();
  const centreOrig = origin.sub(centre).toVar();
  const b = float(2.0).mul( dot(dir, centreOrig) ).toVar();
  const c = dot(centreOrig, centreOrig).sub(radius.mul(radius)).toVar();
  const discr = b.mul(b).sub(a.mul(c).mul(4)).toVar();
  const res = float(-1);
  If( discr.greaterThanEqual(0), () => {
    res.assign( b.mul(-1).sub( sqrt(discr) ).div(a.mul(2)) );
  });
  return res;
});

export const RaymarchingSphere = ( steps, callback ) => {
  const vCentre = varying( modelPosition );
  const vRadius = varying( modelRadius );
  const vOrigin = varying( cameraPosition );
  const vDirection = varying( positionWorld.sub( vOrigin ) );

  // distance to surface
  const surfDist = length(vCentre.sub(vOrigin)).sub(vRadius).toVar();
  surfDist.lessThanEqual(0).discard();

  // get intersect distance
  const rayDir = vDirection.normalize();
  const d0 = RaySphereIntersectDistance( vOrigin, rayDir, vCentre, vRadius ).toVar();
  const d1 = length(vDirection).toVar();
  
  // discard 0 length
  d1.lessThanEqual(d0).discard();
  
  // get steps LOD
  const stepsLOD = max(1, steps.div(max(1, surfDist.mul(0.25)))).toVar();
	const inc = vec3( rayDir.abs().reciprocal() ).toVar();
	const delta = float( min( inc.x, min( inc.y, inc.z ) ) ).toVar();
	delta.divAssign( float( stepsLOD ) );
	const positionRay = vec3( vOrigin.add( d0.mul( rayDir ) ) ).toVar();

	Loop( { type: 'float', start: d0, end: d1, update: delta }, () => {
		callback( { positionRay } );
		positionRay.addAssign( rayDir.mul( delta ) );
	} );
};

/** Raymarch */
const MAX_ITER = 256;
const RAY_START = 0.5;
const RAY_DEFAULT_STEP = 0.05;
export const Raymarch = ( steps, callback ) => {
  const vOrigin = varying( cameraPosition );
  const vDirection = varying( positionWorld.sub( vOrigin ) );
  const rayDir = vDirection.normalize();
  const start = float(RAY_START);
  const stop = min(8, length(vDirection)).toVar()
  const inc = vec3( rayDir.abs().reciprocal() ).toVar();
	const delta = min(stop.sub(start).abs().div(steps), float( RAY_DEFAULT_STEP )).toVar(); // float( min( inc.x, min( inc.y, inc.z ) ) ).div(steps).toVar();
	const positionRay = vec3( vOrigin.add( start.mul( rayDir ) ) ).toVar();
  const travelled = delta.toVar();
  const iter = float(0).toVar();
  Loop( { type: 'float', start: start, end: stop, update: delta }, () => {
    callback( { positionRay, travelled });
		positionRay.addAssign( rayDir.mul( delta ) );
    travelled.addAssign( delta );
    iter.addAssign(1);
    If (iter.greaterThanEqual(MAX_ITER), () => { Break(); });
  });
};