/** ComputeFogTexture */

import { Storage3DTexture, RepeatWrapping } from 'three/webgpu';
import { Fn, If, sin, instanceIndex, max, float, vec3, vec4, mx_noise_vec3, triNoise3D, time, textureStore, length, mix, PI2 } from 'three/tsl';

export const ComputeFogTexture = () => {
  const size = 100;
  const size_half = size / 2;
  const TIME_SCALE = 0.15;
  const NOISE_POSITION_SCALE = 0.15; // 0.035;

  const computeCloud = Fn( ([ storageTexture ]) => {
    const id = instanceIndex;
    const x = id.mod( size ).toVar();
    const y = id.div( size ).mod( size ).toVar();
    const z = id.div( size * size ).toVar();
    const samp = vec3( x, y, z ).toVar();
    const centered = samp.sub( size_half ).div( size ).toVar(); // [-0.5, 0.5]   
    const yFactor = centered.y.add(0.5).toVar(); // [0, 1]
    const d = float( 1.0 ).sub( centered.length() ).toVar();
    const noiseCoord = samp.mul( NOISE_POSITION_SCALE )
      .mul( yFactor.mul(3).add(1) )
      .add( time.mul( TIME_SCALE ) );
    const noise = mx_noise_vec3(noiseCoord).mul(d).mul(d).toVar();
    
    //const maxCoord = max( x, max(y, z) ).toVar();
    /*
    If( maxCoord.greaterThan(size_half), () => {
      const sampOffset = vec3(0).toVar();
      If( (maxCoord.equal(x)), () => { sampOffset.x.assign(maxCoord); } )
      .ElseIf( (maxCoord.equal(y)), () => { sampOffset.y.assign(maxCoord); } )
      .Else( () => { sampOffset.z.assign(maxCoord); } );
      noise.assign( 
        mix( 
          noise,
          computeNoise( samp.sub(sampOffset) ),
          float(maxCoord).sub(size_half).div(size_half)
        )
      );
    });
    */

    textureStore( storageTexture, vec3( x, y, z ), vec4( vec3(noise.x), 1.0 ));
  } );

  const storageTexture = new Storage3DTexture(size, size, size);
  //storageTexture.wrapS = RepeatWrapping;
  //storageTexture.wrapT = RepeatWrapping;
  storageTexture.generateMipmaps = false;
  const computeNode = computeCloud(storageTexture).compute(size * size * size);

  return { computeNode, storageTexture };
};