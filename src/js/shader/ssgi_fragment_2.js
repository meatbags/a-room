export const fragment = `

#include <packing>

uniform uint sliceCount;
uniform uint stepCount;
uniform float aoIntensity;
uniform float giIntensity;
uniform float radius;
uniform uint useScreenSpaceSampling;
uniform float expFactor;
uniform float thickness;
uniform uint useLinearThickness;
uniform float backfaceLighting;
uniform vec2 _resolution;
uniform float _temporalDirection;
uniform float _halfProjScale;
uniform float _temporalOffset;
uniform mat4 _cameraProjectionMatrix;
uniform mat4 _cameraProjectionMatrixInverse;
uniform float _cameraFar;
uniform float _cameraNear;

uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tVelocity;

varying vec2 vUv;

const float PI = 3.141592653589793;
const float PI_HALF = 1.5707963267948966;

float interleavedGradientNoise ( vec2 position ) {
	return fract( ( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) ) );
}

float spatialOffsets ( vec2 position ) {
	return ( 0.25 * float( ( int( ( position.y - position.x ) ) & 3 ) ) );
}

vec3 colorToDirection( sampler2D tex, vec2 coord ) {
  return texture2D(tex, coord).rgb * 2.0 - 1.0;
}

float readDepth( sampler2D tex, vec2 coord ) {
  return texture2D( tex, coord ).x;
  //float fragCoordZ = texture2D( depthSampler, coord ).x;
  //float viewZ = perspectiveDepthToViewZ( fragCoordZ, _cameraNear, _cameraFar );
  //return 1.0 - viewZToOrthographicDepth( viewZ, _cameraNear, _cameraFar );
}

vec2 GTAOFastAcos ( vec2 value ) {
	vec2 outVal;
	float x;
	float y;
	outVal = ( ( abs( value ) * vec2( -0.156583 ) ) + vec2( PI_HALF ) );
	outVal = ( outVal * sqrt( ( vec2( 1.0 ) - abs( value ) ) ) );

	if ( ( value.x >= 0.0 ) ) {
		x = outVal.x;
	} else {
		x = ( PI - outVal.x );
	}

	if ( ( value.y >= 0.0 ) ) {
		y = outVal.y;
	} else {
		y = ( PI - outVal.y );
	}

	return vec2( x, y );
}

uint bitCount ( uint value ) {
	uint v;
	v = value;
	v = ( v - ( ( v >> 1u ) & 1431655765u ) );
	v = ( ( v & 858993459u ) + ( ( v >> 2u ) & 858993459u ) );
	return ( ( ( ( v + ( v >> 4u ) ) & 252645135u ) * 16843009u ) >> 24u );
}

vec3 getViewPosition(vec2 screen, float depth) {
  vec4 clipSpacePosition = vec4(vec3(screen.x, 1.0 - screen.y, depth) * 2.0 - 1.0, 1.0);
  vec4 viewSpacePosition = _cameraProjectionMatrixInverse * clipSpacePosition;
  return viewSpacePosition.xyz / viewSpacePosition.w;
}

void main() {
  // DEBUGGING
  if (vUv.x > 0.2 && vUv.y > 0.6) {
    if (vUv.x < 0.4) {
      gl_FragColor = texture2D(tDiffuse, vUv);
    } else if (vUv.x < 0.6) {
      if (vUv.y > 0.85)
        gl_FragColor = texture2D(tNormal, vUv);
      else
        gl_FragColor = vec4( colorToDirection( tNormal, vUv), 1.0 );
    } else if (vUv.x < 0.8) {
      gl_FragColor = vec4(texture2D( tDepth, vUv ).x);
    } else {
      vec4 v = texture2D( tVelocity, vUv );
      float vx = unpackRGToDepth( v.rg );
      float vy = unpackRGToDepth( v.ba );
      vec2 velocity = (vec2(vx, vy) - 0.5) * 4.0;
      float c = min(length(velocity), 20.0) / 1.0;
      gl_FragColor = vec4(c, c, c, 1.0);
    }
  } else {
    // vars
    
    vec3 sliceDir;
    vec2 slideDirTexelSize;
    vec3 planeNormal;
    vec3 tangent;
    vec3 projectedNormal;
    vec3 projectedNormalNormalized;
    float cos_n;
    float n;
    uint STEP_COUNT;
    float EXP_FACTOR;
    float THICKNESS;
    float BACKFACE_LIGHTING;
    float stepRadius;
    bool nodeVar11;
    vec3 color_1;
    vec3 lastSampleViewPosition;
    float spatialNoise;
    float nodeVar13;
    float offset;
    vec2 uvOffset;
    vec2 kernelRotation;
    vec2 sampleUV;
    vec2 nodeVar16;
    bool nodeVar17;
    vec2 nodeVar18;
    float depth2;
    vec3 sampleViewPosition;
    vec3 pixelToSample;
    vec2 nodeVar20;
    float nodeVar22;
    bool nodeVar23;
    float nodeVar24;
    float nodeVar25;
    bool nodeVar26;
    float minHorizon;
    float maxHorizon;
    uint startHorizonInt;
    uint angleHorizonInt;
    uint nodeVar27;
    uint angleHorizonBitfield;
    uint nodeVar28;
    uint nodeVar29;
    vec2 nodeVar30;
    vec2 diffuseUV;
    bool nodeVar32;
    vec2 nodeVar33;
    vec4 diffuseSample;
    vec3 nodeVar35;
    float nodeVar36;
    float nodeVar37;
    float nodeVar44;
    float nodeVar45;
    uint STEP_COUNT_1;
    float EXP_FACTOR_1;
    float THICKNESS_1;
    float BACKFACE_LIGHTING_1;
    float stepRadius_1;
    vec3 color_2;
    vec3 lastSampleViewPosition_1;
    float nodeVar47;
    float offset_1;
    vec2 uvOffset_1;
    vec2 sampleUV_1;
    vec2 nodeVar49;
    vec2 nodeVar50;
    bool nodeVar51;
    vec2 nodeVar52;
    float depth3;
    vec3 sampleViewPosition_1;
    vec3 pixelToSample_1;
    vec2 nodeVar54;
    float nodeVar55;
    float nodeVar56;
    bool nodeVar57;
    float nodeVar58;
    float nodeVar59;
    float minHorizon_1;
    float maxHorizon_1;
    uint startHorizonInt_1;
    uint angleHorizonInt_1;
    uint nodeVar61;
    uint angleHorizonBitfield_1;
    uint nodeVar62;
    uint nodeVar63;
    vec2 nodeVar64;
    vec2 nodeVar65;
    bool nodeVar66;
    vec2 nodeVar67;
    vec4 nodeVar68;
    vec3 nodeVar69;
    float nodeVar70;
    float nodeVar71;
    vec2 nodeVar72;
    vec2 nodeVar73;
    bool nodeVar74;
    vec2 nodeVar75;
    vec4 nodeVar76;
    vec3 nodeVar77;
    float nodeVar78;
    float nodeVar79;
    float maxLuminance;
    float colorScale;
    float luminance;

    // set occluded
    uint globalOccludedBitfield = 0u;

    // depth
    float depth = readDepth( tDepth, vUv );
    if (depth >= 1.0) {
      discard;
    }

    // get view position
    vec3 viewPosition = getViewPosition( vUv, depth );

    // get view normal, direction
    vec3 viewNormal = normalize( colorToDirection( tNormal, vUv ) );
    vec3 viewDir = normalize( - viewPosition );

    // offsets
    float noiseDirection = interleavedGradientNoise(gl_FragCoord.xy);

    // ao, color targets
    float ao = 0.0;
    vec3 color = vec3( 0.0, 0.0, 0.0 );

    // settings
    uint ROTATION_COUNT = sliceCount;
    float AO_INTENSITY = aoIntensity;
    float GI_INTENSITY = giIntensity;
    float RADIUS = radius;
    float rotationAngle;
    bool boolUseLinearThickness = bool(useLinearThickness);

    for (uint i = 0u; i < ROTATION_COUNT; i ++) {
      //
      rotationAngle = ((float(i) + noiseDirection) + _temporalDirection) * (PI / float(ROTATION_COUNT)) ;
      sliceDir = vec3( vec2( cos( rotationAngle ), sin( rotationAngle ) ), 0.0 );
      slideDirTexelSize = ( sliceDir.xy * ( vec2( 1.0 ) / _resolution ) );

      //
      planeNormal = normalize( cross( sliceDir, viewDir ) );
      tangent = cross( viewDir, planeNormal );
      projectedNormal = ( viewNormal - ( planeNormal * vec3( dot( viewNormal, planeNormal ) ) ) );
      projectedNormalNormalized = normalize( projectedNormal );
      
      //  
      cos_n = clamp( dot( projectedNormalNormalized, viewDir ), -1.0, 1.0 );
      n = (-sign(dot( projectedNormal, tangent ))) * acos( cos_n );

      //
      globalOccludedBitfield = 0u;

      // horizonSampling ?
      STEP_COUNT = stepCount;
      EXP_FACTOR = expFactor;
      THICKNESS = thickness;
      BACKFACE_LIGHTING = backfaceLighting;
      stepRadius = 0.0;

      if (bool(useScreenSpaceSampling) == true) {
        stepRadius = (RADIUS * (_resolution.x / 2.0)) / 16.0;
      } else {
        stepRadius = max(((RADIUS * _halfProjScale) / ( - viewPosition.z )), float(STEP_COUNT));
      }

      stepRadius = ( stepRadius / ( float( STEP_COUNT ) + 1.0 ) );
      color_1 = vec3(0.0, 0.0, 0.0);
      lastSampleViewPosition = viewPosition;

      for (uint i = 0u; i < STEP_COUNT; i++) {
        spatialNoise = (
          fract(spatialOffsets(gl_FragCoord.xy) + _temporalOffset) + 
          fract((sin(mod(dot(
            (((vUv + vec2(_temporalDirection * 0.02)) * 2.0) - 1.0)
            , vec2(12.9898, 78.233)), PI)) * 43758.5453)));
        nodeVar13 = max( 1.0, float( ( STEP_COUNT - 1u ) ) ) * stepRadius;
        offset = ( pow( abs( ( ( 
          stepRadius * ( float( i ) + spatialNoise ) ) / nodeVar13 ) ), EXP_FACTOR ) * nodeVar13 );
        uvOffset = ( slideDirTexelSize * 
          vec2( max( offset, ( float( i ) + 1.0 ) ) ) );

        // rotate uv
        sampleUV = (vUv + (uvOffset * vec2(1.0, -1.0)));

        if (sampleUV.x <= 0.0 || sampleUV.y <= 0.0 || sampleUV.x >= 1.0 || sampleUV.y >= 1.0) {
          break;
        }

        // depth2 = texture2D( tDepth, nodeVar16 ).x;
        depth2 = readDepth( tDepth, sampleUV );
        sampleViewPosition = getViewPosition( sampleUV, depth2 );
        pixelToSample = normalize( ( sampleViewPosition - viewPosition ) );

        if (boolUseLinearThickness == true) {
          nodeVar22 = ( clamp( ( ( - sampleViewPosition.z ) / _cameraFar ), 0.0, 1.0 ) * 100.0 );
        } else {
          nodeVar22 = 1.0;
        }
        nodeVar20 = clamp( ( ( ( vec2( 1.0 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample, viewDir ), 
            dot( normalize( ( ( sampleViewPosition - ( ( vec3( nodeVar22 ) * viewDir ) * vec3( THICKNESS ) ) ) - viewPosition ) ), 
            viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - PI_HALF ) ) ) / vec2( PI )
          ), vec2( 0.0 ), vec2( 1.0 ) ).yx;

        minHorizon = nodeVar20.x;
        maxHorizon = nodeVar20.y;
        startHorizonInt = uint( ( nodeVar20 * vec2( 32.0 ) ).x );
        angleHorizonInt = uint( ceil( ( ( maxHorizon - minHorizon ) * 32.0 ) ) );

        if ( ( angleHorizonInt > 0u ) ) {
          nodeVar27 = ( 4294967295u >> ( ( 32u - 32u ) + ( 32u - angleHorizonInt ) ) );
        } else {
          nodeVar27 = 0u;
        }

        angleHorizonBitfield = nodeVar27;
        nodeVar28 = ( ( angleHorizonBitfield << startHorizonInt ) & ( ~globalOccludedBitfield ) );
        globalOccludedBitfield = ( globalOccludedBitfield | nodeVar28 );
        nodeVar29 = bitCount( nodeVar28 );

        if ( float( nodeVar29 ) > 0.0 ) {
          diffuseSample = texture2D( tDiffuse, sampleUV );

          if ( ( dot( diffuseSample, vec4( vec3( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {
            nodeVar35 = normalize( pixelToSample );
            nodeVar36 = clamp( dot( viewNormal, nodeVar35 ), 0.0, 1.0 );

            if ( ( nodeVar36 > 0.001 ) ) {
              vec3 normalSample2Normal = normalize( colorToDirection( tNormal, sampleUV ) );

              if ( ( ( BACKFACE_LIGHTING > 0.0 ) && ( dot( normalSample2Normal, viewDir ) > 0.0 ) ) ) {
                nodeVar45 = dot( normalSample2Normal, ( - nodeVar35 ) );
                if ( ( sign( nodeVar45 ) < 0.0 ) ) {
                  nodeVar44 = ( abs( nodeVar45 ) * BACKFACE_LIGHTING );
                } else {
                  nodeVar44 = abs( nodeVar45 );
                }
                nodeVar37 = nodeVar44;
              } else {
                nodeVar37 = clamp( dot( normalSample2Normal, ( - nodeVar35 ) ), 0.0, 1.0 );
              }

              color_1 = ( vec4( color_1, 1.0 ) + ( ( ( vec4( ( float( nodeVar29 ) / 32.0 ) ) * diffuseSample ) * vec4( nodeVar36 ) ) * vec4( nodeVar37 ) ) ).xyz;
            }
          }
        }

        lastSampleViewPosition = sampleViewPosition;
      }

      color = ( color + color_1 );
      STEP_COUNT_1 = stepCount;
      EXP_FACTOR_1 = expFactor;
      THICKNESS_1 = thickness;
      BACKFACE_LIGHTING_1 = backfaceLighting;
      stepRadius_1 = 0.0;

      if ( ( nodeVar11 == true ) ) {
        stepRadius_1 = ( ( RADIUS * ( _resolution.x / 2.0 ) ) / 16.0 );
      } else {
        stepRadius_1 = max( ( ( RADIUS * _halfProjScale ) / ( - viewPosition.z ) ), float( STEP_COUNT_1 ) );
      }

      stepRadius_1 = ( stepRadius_1 / ( float( STEP_COUNT_1 ) + 1.0 ) );
      color_2 = vec3( 0.0, 0.0, 0.0 );
      lastSampleViewPosition_1 = viewPosition;

      for ( uint i = 0u; i < STEP_COUNT_1; i ++ ) {
        nodeVar47 = ( max( 1.0, float( ( STEP_COUNT_1 - 1u ) ) ) * stepRadius_1 );
        offset_1 = ( pow( abs( ( ( stepRadius_1 * ( float( i ) + spatialNoise ) ) / nodeVar47 ) ), EXP_FACTOR_1 ) * nodeVar47 );
        uvOffset_1 = ( slideDirTexelSize * vec2( max( offset_1, ( float( i ) + 1.0 ) ) ) );

        sampleUV_1 = ( vUv + ( uvOffset_1 * vec2( -1.0, 1.0 ) ) );

        if (sampleUV_1.x <= 0.0 || sampleUV_1.y <= 0.0 || sampleUV_1.x >= 1.0 || sampleUV_1.y >= 1.0) {
          break;
        }

        // depth3 = texture2D( tDepth, sampleUV_1 ).x;
        depth3 = readDepth( tDepth, sampleUV_1 );
        sampleViewPosition_1 = getViewPosition( sampleUV_1, depth3 );
        pixelToSample_1 = normalize( ( sampleViewPosition_1 - viewPosition ) );

        nodeVar58 = -1.0;

        if ( ( boolUseLinearThickness == true ) ) {
          nodeVar59 = ( clamp( ( ( - sampleViewPosition_1.z ) / _cameraFar ), 0.0, 1.0 ) * 100.0 );
        } else {
          nodeVar59 = 1.0;
        }

        nodeVar54 = clamp( ( ( ( vec2( nodeVar58 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample_1, viewDir ), 
          dot( normalize( ( ( sampleViewPosition_1 - ( ( vec3( nodeVar59 ) * viewDir ) * vec3( THICKNESS_1 ) ) ) - viewPosition ) ), viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - PI_HALF ) ) ) / vec2( PI ) ), vec2( 0.0 ), vec2( 1.0 ) );

        minHorizon_1 = nodeVar54.x;
        maxHorizon_1 = nodeVar54.y;
        startHorizonInt_1 = uint( ( nodeVar54 * vec2( 32.0 ) ).x );
        angleHorizonInt_1 = uint( ceil( ( ( maxHorizon_1 - minHorizon_1 ) * 32.0 ) ) );

        if ( ( angleHorizonInt_1 > 0u ) ) {
          nodeVar61 = ( 4294967295u >> ( ( 32u - 32u ) + ( 32u - angleHorizonInt_1 ) ) );
        } else {
          nodeVar61 = 0u;
        }

        angleHorizonBitfield_1 = nodeVar61;
        nodeVar62 = ( ( angleHorizonBitfield_1 << startHorizonInt_1 ) & (~globalOccludedBitfield) );
        globalOccludedBitfield = ( globalOccludedBitfield | nodeVar62 );
        nodeVar63 = bitCount( nodeVar62 );

        if ( ( float( nodeVar63 ) > 0.0 ) ) {
          nodeVar68 = texture2D( tDiffuse, sampleUV_1 );

          if ( ( dot( nodeVar68, vec4( vec3( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {
            nodeVar69 = normalize( pixelToSample_1 );
            nodeVar70 = clamp( dot( viewNormal, nodeVar69 ), 0.0, 1.0 );

            if ( ( nodeVar70 > 0.001 ) ) {
              vec3 normal = normalize( colorToDirection( tNormal, sampleUV_1 ) );

              if (BACKFACE_LIGHTING_1 > 0.0 && dot(normal, viewDir) > 0.0) {
                nodeVar79 = dot( normal, ( - nodeVar69 ) );
                if ( ( sign( nodeVar79 ) < 0.0 ) ) {
                  nodeVar78 = ( abs( nodeVar79 ) * BACKFACE_LIGHTING_1 );
                } else {
                  nodeVar78 = abs( nodeVar79 );
                }
                nodeVar71 = nodeVar78;
              } else {
                nodeVar71 = clamp( dot( normal, ( - nodeVar69 ) ), 0.0, 1.0 );
              }

              color_2 = ( vec4( color_2, 1.0 ) + ( ( ( vec4( ( float( nodeVar63 ) / 32.0 ) ) * nodeVar68 ) * vec4( nodeVar70 ) ) * vec4( nodeVar71 ) ) ).xyz;
            }
          }
        }

        lastSampleViewPosition_1 = sampleViewPosition_1;
      }

      color = ( color + color_2 );
      ao = ( ao + ( float( bitCount( globalOccludedBitfield ) ) / 32.0 ) );
    }

    ao = ( ao / float( ROTATION_COUNT ) );
    ao = clamp( pow( ( 1.0 - clamp( ao, 0.0, 1.0 ) ), AO_INTENSITY ), 0.0, 1.0 );
    color = ( color / vec3( float( ROTATION_COUNT ) ) );
    color = ( color * vec3( GI_INTENSITY ) );
    maxLuminance = 7.0;
    luminance = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );

    if ( ( luminance > maxLuminance ) ) {
      colorScale = ( maxLuminance / luminance );
    } else {
      colorScale = 1.0;
    }

    color = ( color * vec3( colorScale ) );

    // result
    // todo -- move to acc shader then make composite
    gl_FragColor = vec4( color, ao );

    //
    // vec3 gi = color;
    // vec4 diffuseColor = texture2D( tDiffuse, vUv );
    // vec4 sceneColor = diffuseColor;
    // gl_FragColor = vec4((diffuseColor.rgb * ao) + (diffuseColor.rgb * gi), sceneColor.a);

  }
}
`;