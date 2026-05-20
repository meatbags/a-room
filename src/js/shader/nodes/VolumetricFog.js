/** VolumetricFog */

import { Fn, If, Break, float, vec3, vec4, lengthSq, smoothstep, mx_noise_vec3, positionWorld } from 'three/tsl';
import { Raymarch } from './Raymarch';

/**
 * @param { Storage3DTexture } texture - 3d fog texture
 * @param { float } range - alpha range
 * @param { float } threshold - alpha threshold
 * @param { float } opacity - opacity multiplier
 * @param { float } steps - steps per world unit
 * @param { float } alphaCutoff - fog alpha cutoff threshold
 * @param { float } textureScale - texture scale modifier
 */
export const VolumetricFog = Fn(({
  texture,
  range = float( 0.1 ),
  threshold = float( 0.25 ),
  opacity = float( 0.25 ),
  steps = float( 32 ),
  alphaCutoff = float( 0.95 ),
  textureScale = float( 1 ),
  fadeRange = float( 2 ),
  fadeStart = float( 8 ),
}) => {
  const finalColor = vec4( 0 ).toVar();
  //const offsetLarge = mx_noise_vec3( positionWorld.mul(0.1) ).mul(0.25).toVar();
  const offsetSmall = mx_noise_vec3( positionWorld.mul(100) ).fract().mul(0.05).toVar();
  Raymarch( steps, ( { positionRay, distanceTravelled } ) => {
    const p = positionRay.add( offsetSmall ).div( textureScale ).mod(1).toVar();
    const mapValue = float( texture.sample( p ).r ).toVar();
    mapValue.assign( 
      smoothstep( threshold.sub( range ), threshold.add( range ), mapValue)
        .mul( opacity )
        .mul( distanceTravelled.div( fadeRange ).clamp(0, 1) )
        .mul( distanceTravelled.sub( fadeStart ).div( fadeRange ).clamp(0, 1).oneMinus() )
    );
    const shading = texture.sample( p.add( vec3( - 0.01 ) ) ).r
      .sub( texture.sample( p.add( vec3( 0.01 ) ) ).r );
    const col = shading.mul( 4.0 ).add( p.x.add( p.y ).mul( 0.5 ) ).add( 0.3 );
    finalColor.rgb.addAssign( finalColor.a.oneMinus().mul( mapValue ).mul( col ) );
    finalColor.a.addAssign( finalColor.a.oneMinus().mul( mapValue ) );
    If( finalColor.a.greaterThanEqual( alphaCutoff ), () => {
      finalColor.assign( finalColor.clamp(0, 1) );
      Break();
    } );
  } );
  return finalColor;
});