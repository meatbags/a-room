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
const float HALF_PI = 1.5707963267948966;

/** get depth */
float sampleDepth(vec2 uv) {
  return unpackRGBAToDepth( texture2D( tDepth, uv ) );//, _cameraNear, _cameraFar );
}

/** get normal */
vec3 sampleNormal(vec2 uv) {
  return normalize( texture2D( tNormal, uv ).rgb * 2.0 - 1.0 );
}

/** get diffuse */
vec4 sampleBeauty(vec2 uv) {
  return texture2D( tDiffuse, uv );
}

/** gradient noise */
float interleavedGradientNoise(vec2 position) {
	return fract(52.9829189 * fract(dot(position, vec2(0.06711056, 0.00583715))));
}

/** get spatial offsets */
float spatialOffsets(vec2 position) {
	return 0.25 * float(int(position.y - position.x) & 3);
}

/** GTAO */
vec2 GTAOFastAcos (vec2 value) {
	vec2 outVal;
	outVal = (abs( value ) * vec2( -0.156583 )) + HALF_PI;
	outVal = outVal * sqrt((vec2( 1.0 ) - abs(value)));
  float x = value.x >= 0.0 ? outVal.x : PI - outVal.x;
  float y = value.y >= 0.0 ? outVal.y : PI - outVal.y;
	return vec2(x, y);
}

/** bit count */
uint bitCount(uint value) {
	uint v = value;
	v = v - ((v >> 1u) & 1431655765u);
	v = (v & 858993459u) + ((v >> 2u) & 858993459u);
	return (((v + (v >> 4u)) & 252645135u) * 16843009u) >> 24u;
}

/*
let clipSpacePosition;
if ( builder.renderer.coordinateSystem === WebGPUCoordinateSystem ) {
	screenPosition = vec2( screenPosition.x, screenPosition.y.oneMinus() ).mul( 2.0 ).sub( 1.0 );
	clipSpacePosition = vec4( vec3( screenPosition, depth ), 1.0 );
} else {
	clipSpacePosition = vec4(
    vec3( screenPosition.x, screenPosition.y.oneMinus(), depth ).mul( 2.0 ).sub( 1.0 ), 1.0 );
}
const viewSpacePosition = vec4( projectionMatrixInverse.mul( clipSpacePosition ) );
return viewSpacePosition.xyz.div( viewSpacePosition.w );
*/
vec3 getViewPosition(vec2 screen, float depth) {
  screen = vec2(screen.x, 1.0 - screen.y) * 2.0 - 1.0;
  vec4 clipSpacePosition = vec4(vec3(screen, depth), 1.0);
  //vec4 clipSpacePosition = vec4(vec3(screen.x, 1.0 - screen.y, depth) * 2.0 - 1.0, 1.0);
  vec4 viewSpacePosition = _cameraProjectionMatrixInverse * clipSpacePosition;
  return viewSpacePosition.xyz / viewSpacePosition.w;
}

/** vec2 to random */
float rand(vec2 coord) {
  return fract(sin(mod(dot(coord, vec2(12.9898, 78.233)), PI)) * 43758.5453);
}

/** horizon sampling */
struct colorBit {
  vec3 color;
  uint bit;
};
colorBit horizonSampling(
  bool directionIsRight, 
  float RADIUS, 
  vec3 viewPosition, 
  vec2 slideDirTexelSize, 
  float initialRayStep, 
  vec2 uv, 
  vec3 viewDir, 
  vec3 viewNormal, 
  float n, 
  uint globalOccludedBitfield
) {
  colorBit res;
  res.color = vec3(0.0);
  res.bit = globalOccludedBitfield;

  // horizon sampling setup
  uint STEP_COUNT = stepCount;
  float EXP_FACTOR = expFactor;
  float THICKNESS = thickness;
  float BACKFACE_LIGHTING = backfaceLighting;
  uint MAX_RAY = 32u;

  // radius / direction setup
  float stepRadius = 0.0;
  if (bool(useScreenSpaceSampling)) {
    stepRadius = (RADIUS * (_resolution.x / 2.0)) / 16.0;
  } else {
    stepRadius = max((RADIUS * _halfProjScale) / -viewPosition.z, float(STEP_COUNT));
  }
  stepRadius = stepRadius / (float(STEP_COUNT) + 1.);
  float radiusVS = max(1., float(STEP_COUNT - 1u)) * stepRadius;
  vec2 uvDirection = directionIsRight ? vec2(1., -1.) : vec2(-1., 1.);
  float samplingDirection = directionIsRight ? 1. : -1.;
  vec3 lastSampleViewPosition = viewPosition;
  
  for (uint i=0u; i<STEP_COUNT; i++) {
    float offset = pow(abs( stepRadius * (float(i) + initialRayStep) / radiusVS) , EXP_FACTOR) * radiusVS;
    vec2 uvOffset = slideDirTexelSize * max(offset, float(i) + 1.0);
    vec2 sampleUV = uv + uvOffset * uvDirection;

    // break offscreen
    if (sampleUV.x <= 0.0 || sampleUV.y <= 0.0 || sampleUV.x >= 1.0 || sampleUV.y >= 1.0) {
      break;
    }

    vec3 sampleViewPosition = getViewPosition(sampleUV, sampleDepth(sampleUV));
    vec3 pixelToSample = normalize(sampleViewPosition - viewPosition);
    float linearThicknessMultiplier = bool(useLinearThickness) == true ? clamp(-sampleViewPosition.z / _cameraFar, 0.0, 1.0) * 100.0 : 1.0;
    vec3 pixelToSampleBackface = normalize(sampleViewPosition - (linearThicknessMultiplier * viewDir * THICKNESS) - viewPosition);
    
    // do GTAO
    vec2 frontBackHorizon = vec2(dot(pixelToSample, viewDir), dot(pixelToSampleBackface, viewDir));
    frontBackHorizon = GTAOFastAcos(clamp(frontBackHorizon, -1.0, 1.0));
    frontBackHorizon = clamp(((samplingDirection * -frontBackHorizon) - (n - HALF_PI)) / PI, 0.0, 1.0);
    frontBackHorizon = directionIsRight ? frontBackHorizon.yx : frontBackHorizon.xy;

    // occlusion ?
    float minHorizon = frontBackHorizon.x;
    float maxHorizon = frontBackHorizon.y;
    uint startHorizonInt = uint((frontBackHorizon * float(MAX_RAY)).x);
    uint angleHorizonInt = uint(ceil((maxHorizon - minHorizon) * float(MAX_RAY)));
    uint angleHorizonBitfield = angleHorizonInt > 0u ? 4294967295u >> ((32u - MAX_RAY) + (MAX_RAY - angleHorizonInt)) : 0u;
    uint currentOccludedBitField = ((angleHorizonBitfield << startHorizonInt) & (~ res.bit));
    res.bit = res.bit | currentOccludedBitField;
    uint numOccludedZones = bitCount(currentOccludedBitField);

    // If a ray hit the sample, that sample is visible from shading point
    if (numOccludedZones > 0u) {
      vec4 lightColor = sampleBeauty( sampleUV );

      // Continue if there is light at that location (intensity > 0)
      if (dot(lightColor, vec4(0.2126, 0.7152, 0.0722, 1.0)) > 0.001) {
        vec3 lightDirectionVS = normalize(pixelToSample);
        float normalDotLightDirection = clamp(dot(viewNormal, lightDirectionVS), 0.0, 1.0);

        // Continue if light is facing surface normal
        if (normalDotLightDirection > 0.001) {
          vec3 lightNormalVS = sampleNormal(sampleUV);

          // Intensity of outgoing light in the direction of the shading point
          float lightNormalDotLightDirection = dot(lightNormalVS, -lightDirectionVS);
          float d = sign(lightNormalDotLightDirection) < 0.0 ? abs(lightNormalDotLightDirection) * BACKFACE_LIGHTING : abs(lightNormalDotLightDirection);
          lightNormalDotLightDirection = BACKFACE_LIGHTING > 0.0 && dot(lightNormalVS, viewDir) > 0.0 ? d : clamp(lightNormalDotLightDirection, 0.0, 1.0);

          // add colour
          res.color = res.color + ((float(numOccludedZones) / float(MAX_RAY)) * lightColor * normalDotLightDirection * lightNormalDotLightDirection).xyz;
        }
      }
    }

    lastSampleViewPosition = sampleViewPosition;
  }

  return res;
}

void main() {
  // setup
  uint globalOccludedBitfield = 0u;

  // get depth
  float depth = sampleDepth(vUv);
  if (depth >= 1.0) {
    discard;
  }

  // view props
  vec3 viewPosition = getViewPosition(vUv, depth);
  vec3 viewNormal = sampleNormal(vUv);
  vec3 viewDir = normalize(-viewPosition);

  // offsets
  float noiseOffset = spatialOffsets(gl_FragCoord.xy);
  float noiseDirection = interleavedGradientNoise(gl_FragCoord.xy);
  float noiseJitterIdx = _temporalDirection * 0.02; // NB -- for TRAA convergence
  float initialRayStep = fract(noiseOffset + _temporalOffset) + rand((vUv + noiseJitterIdx) * 2.0 - 1.0);

  // ao, colour output
  float ao = 0.0;
  vec3 color = vec3(0.0);

  // setup
  uint ROTATION_COUNT = sliceCount;
  float AO_INTENSITY = aoIntensity;
  float GI_INTENSITY = giIntensity;
  float RADIUS = radius;

  for (uint i=0u; i<ROTATION_COUNT; i++) {
    // direction
    float rotationAngle = (float(i) + noiseDirection + _temporalDirection) * (PI / float(ROTATION_COUNT));
    vec3 sliceDir = vec3(vec2(cos(rotationAngle), sin(rotationAngle)), 0);
    vec2 slideDirTexelSize  = sliceDir.xy * (1.0 / _resolution);

    // helpers
    vec3 planeNormal = normalize(cross(sliceDir, viewDir));
    vec3 tangent = cross(viewDir, planeNormal);
    vec3 projectedNormal = viewNormal - (planeNormal * dot(viewNormal, planeNormal));
    vec3 projectedNormalNormalized = normalize(projectedNormal);
    float cos_n = clamp(dot(projectedNormalNormalized, viewDir), -1.0, 1.0);
    float n = - sign(dot(projectedNormal, tangent)) * acos(cos_n);

    // do left right passes
    globalOccludedBitfield = 0u;
    colorBit passRight = horizonSampling(true, RADIUS, viewPosition, slideDirTexelSize, initialRayStep, vUv, viewDir, viewNormal, n, globalOccludedBitfield);
    globalOccludedBitfield = passRight.bit;
    colorBit passLeft = horizonSampling(false, RADIUS, viewPosition, slideDirTexelSize, initialRayStep, vUv, viewDir, viewNormal, n, globalOccludedBitfield);
    globalOccludedBitfield = passLeft.bit;    

    // apply
    color = color + passRight.color + passLeft.color;
    ao = ao + float(bitCount(globalOccludedBitfield)) / 32.0;
  }

  // finalise output
  ao = ao / float(ROTATION_COUNT);
  ao = clamp(pow(1.0 - clamp(ao, 0.0, 1.0), AO_INTENSITY), 0.0, 1.0);
  color = color / float(ROTATION_COUNT) * GI_INTENSITY;
  float maxLuminance = 7.0;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  if (luminance > maxLuminance) {
    color = color * (maxLuminance / luminance);
  }

  // output
  gl_FragColor = vec4(color, ao);
}
`;