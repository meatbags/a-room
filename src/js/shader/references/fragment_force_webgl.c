#version 300 es

// Three.js r181 - Node System


// extensions


// precision

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler3D;
precision highp samplerCube;
precision highp sampler2DArray;

precision highp usampler2D;
precision highp usampler3D;
precision highp usamplerCube;
precision highp usampler2DArray;

precision highp isampler2D;
precision highp isampler3D;
precision highp isamplerCube;
precision highp isampler2DArray;

precision lowp sampler2DShadow;
precision lowp sampler2DArrayShadow;
precision lowp samplerCubeShadow;


// structs

layout( location = 0 ) out vec4 fragColor;



// uniforms

layout( std140 ) uniform fragment_object {
	uint f_nodeUniform1;
	mat4 f__cameraProjectionMatrixInverse;
	uint f_nodeUniform4;
	uint f_sliceCount;
	float f_aoIntensity;
	float f_giIntensity;
	float f_radius;
	vec2 f_nodeUniform9;
	float f__temporalDirection;
	vec2 f__resolution;
	uint f_stepCount;
	float f_expFactor;
	float f_thickness;
	float f_backfaceLighting;
	uint f_useScreenSpaceSampling;
	float f__halfProjScale;
	float f__temporalOffset;
	uint f_nodeUniform19;
	uint f_useLinearThickness;
	float f__cameraFar;
	uint f_nodeUniform23;
	uint f_nodeUniform24;
	uint f_nodeUniform25;
	uint f_nodeUniform26;
	uint f_nodeUniform27;
};
uniform sampler2D nodeUniform0;
uniform sampler2D nodeUniform3;
uniform sampler2D lightColor;

// varyings
in vec2 nodeVarying3;


// codes
float interleavedGradientNoise ( vec2 position ) {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) ) );

}

float spatialOffsets ( vec2 position ) {

	


	return ( 0.25 * float( ( int( ( position.y - position.x ) ) & 3 ) ) );

}

vec2 GTAOFastAcos ( vec2 value ) {

	vec2 outVal;
	float nodeVar0;
	float nodeVar1;

	outVal = ( ( abs( value ) * vec2( -0.156583 ) ) + vec2( 1.5707963267948966 ) );
	outVal = ( outVal * sqrt( ( vec2( 1.0 ) - abs( value ) ) ) );

	if ( ( value.x >= 0.0 ) ) {

		nodeVar0 = outVal.x;

	} else {

		nodeVar0 = ( 3.141592653589793 - outVal.x );

	}


	if ( ( value.y >= 0.0 ) ) {

		nodeVar1 = outVal.y;

	} else {

		nodeVar1 = ( 3.141592653589793 - outVal.y );

	}


	return vec2( nodeVar0, nodeVar1 );

}

uint bitCount ( uint value ) {

	uint v;

	v = value;
	v = ( v - ( ( v >> 1u ) & 1431655765u ) );
	v = ( ( v & 858993459u ) + ( ( v >> 2u ) & 858993459u ) );

	return ( ( ( ( v + ( v >> 4u ) ) & 252645135u ) * 16843009u ) >> 24u );

}



void main() {

	// vars
	uint nodeVar0;
	vec2 nodeVar1;
	vec2 nodeVar2;
	bool nodeVar3;
	vec2 nodeVar4;
	float nodeVar5;
	float depth;
	vec3 viewPosition;
	vec2 nodeVar6;
	vec2 nodeVar7;
	bool nodeVar8;
	vec2 nodeVar9;
	vec4 nodeVar10;
	vec3 viewNormal;
	vec3 viewDir;
	float ao;
	vec3 color;
	uint ROTATION_COUNT;
	float AO_INTENSITY;
	float GI_INTENSITY;
	float RADIUS;
	float rotationAngle;
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
	float nodeVar12;
	float nodeVar13;
	float offset;
	vec2 uvOffset;
	vec2 nodeVar14;
	vec2 sampleUV;
	vec2 nodeVar15;
	vec2 nodeVar16;
	bool nodeVar17;
	vec2 nodeVar18;
	float nodeVar19;
	vec3 sampleViewPosition;
	vec3 pixelToSample;
	vec2 nodeVar20;
	float nodeVar21;
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
	vec2 nodeVar31;
	bool nodeVar32;
	vec2 nodeVar33;
	vec4 nodeVar34;
	vec3 nodeVar35;
	float nodeVar36;
	float nodeVar37;
	vec2 nodeVar38;
	vec2 nodeVar39;
	bool nodeVar40;
	vec2 nodeVar41;
	vec4 nodeVar42;
	vec3 nodeVar43;
	float nodeVar44;
	float nodeVar45;
	vec3 nodeVar46;
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
	vec2 nodeVar48;
	vec2 sampleUV_1;
	vec2 nodeVar49;
	vec2 nodeVar50;
	bool nodeVar51;
	vec2 nodeVar52;
	float nodeVar53;
	vec3 sampleViewPosition_1;
	vec3 pixelToSample_1;
	vec2 nodeVar54;
	float nodeVar55;
	float nodeVar56;
	bool nodeVar57;
	float nodeVar58;
	float nodeVar59;
	bool nodeVar60;
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
	vec3 nodeVar80;
	float maxLuminance;
	float nodeVar81;
	float nodeVar82;

	// flow
	// code

	nodeVar0 = 0u;
	nodeVar1 = nodeVarying3;
	nodeVar3 = bool( f_nodeUniform1 );

	if ( nodeVar3 ) {

		nodeVar4 = nodeVar1;
		nodeVar2 = vec2( nodeVar4.x, 1.0 - nodeVar4.y );

	} else {

		nodeVar2 = nodeVar1;

	}

	nodeVar5 = texture( nodeUniform0, nodeVar2 ).x;
	depth = nodeVar5;

	if ( ( depth >= 1.0 ) ) {

		discard;
		

	}

	viewPosition = ( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( nodeVarying3.x, ( 1.0 - nodeVarying3.y ), depth ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).xyz / vec3( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( nodeVarying3.x, ( 1.0 - nodeVarying3.y ), depth ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).w ) );
	nodeVar6 = nodeVarying3;
	nodeVar8 = bool( f_nodeUniform4 );

	if ( nodeVar8 ) {

		nodeVar9 = nodeVar6;
		nodeVar7 = vec2( nodeVar9.x, 1.0 - nodeVar9.y );

	} else {

		nodeVar7 = nodeVar6;

	}

	nodeVar10 = texture( nodeUniform3, nodeVar7 );
	viewNormal = normalize( ( ( nodeVar10 * vec4( 2.0 ) ) - vec4( 1.0 ) ).xyz );
	viewDir = normalize( ( - viewPosition ) );
	ao = 0.0;
	color = vec3( 0.0, 0.0, 0.0 );
	ROTATION_COUNT = f_sliceCount;
	AO_INTENSITY = f_aoIntensity;
	GI_INTENSITY = f_giIntensity;
	RADIUS = f_radius;

	for ( uint i = 0u; i < ROTATION_COUNT; i ++ ) {

		rotationAngle = ( ( ( float( i ) + interleavedGradientNoise( vec2( gl_FragCoord.xy.x, f_nodeUniform9.y - gl_FragCoord.xy.y ) ) ) + f__temporalDirection ) * ( 3.141592653589793 / float( ROTATION_COUNT ) ) );
		sliceDir = vec3( vec2( cos( rotationAngle ), sin( rotationAngle ) ), 0.0 );
		slideDirTexelSize = ( sliceDir.xy * ( vec2( 1.0 ) / f__resolution ) );
		planeNormal = normalize( cross( sliceDir, viewDir ) );
		tangent = cross( viewDir, planeNormal );
		projectedNormal = ( viewNormal - ( planeNormal * vec3( dot( viewNormal, planeNormal ) ) ) );
		projectedNormalNormalized = normalize( projectedNormal );
		cos_n = clamp( dot( projectedNormalNormalized, viewDir ), -1.0, 1.0 );
		n = ( ( - sign( dot( projectedNormal, tangent ) ) ) * acos( cos_n ) );
		nodeVar0 = 0u;
		STEP_COUNT = f_stepCount;
		EXP_FACTOR = f_expFactor;
		THICKNESS = f_thickness;
		BACKFACE_LIGHTING = f_backfaceLighting;
		stepRadius = 0.0;
		nodeVar11 = bool( f_useScreenSpaceSampling );

		if ( ( nodeVar11 == true ) ) {

			stepRadius = ( ( RADIUS * ( f__resolution.x / 2.0 ) ) / 16.0 );
			

		} else {

			stepRadius = max( ( ( RADIUS * f__halfProjScale ) / ( - viewPosition.z ) ), float( STEP_COUNT ) );
			

		}

		stepRadius = ( stepRadius / ( float( STEP_COUNT ) + 1.0 ) );
		color_1 = vec3( 0.0, 0.0, 0.0 );
		lastSampleViewPosition = viewPosition;

		for ( uint i = 0u; i < STEP_COUNT; i ++ ) {

			nodeVar12 = ( fract( ( spatialOffsets( vec2( gl_FragCoord.xy.x, f_nodeUniform9.y - gl_FragCoord.xy.y ) ) + f__temporalOffset ) ) + fract( ( sin( mod( dot( ( ( ( nodeVarying3 + vec2( ( f__temporalDirection * 0.02 ) ) ) * vec2( 2.0 ) ) - vec2( 1.0 ) ), vec2( 12.9898, 78.233 ) ), 3.141592653589793 ) ) * 43758.5453 ) ) );
			nodeVar13 = ( max( 1.0, float( ( STEP_COUNT - 1u ) ) ) * stepRadius );
			offset = ( pow( abs( ( ( stepRadius * ( float( i ) + nodeVar12 ) ) / nodeVar13 ) ), EXP_FACTOR ) * nodeVar13 );
			uvOffset = ( slideDirTexelSize * vec2( max( offset, ( float( i ) + 1.0 ) ) ) );

			if ( ( true == true ) ) {

				nodeVar14 = vec2( 1.0, -1.0 );

			} else {

				nodeVar14 = vec2( -1.0, 1.0 );

			}

			sampleUV = ( nodeVarying3 + ( uvOffset * nodeVar14 ) );

			if ( ( ( ( ( sampleUV.x <= 0.0 ) || ( sampleUV.y <= 0.0 ) ) || ( sampleUV.x >= 1.0 ) ) || ( sampleUV.y >= 1.0 ) ) ) {

				break;
				

			}

			nodeVar15 = sampleUV;
			nodeVar17 = bool( f_nodeUniform19 );

			if ( nodeVar17 ) {

				nodeVar18 = nodeVar15;
				nodeVar16 = vec2( nodeVar18.x, 1.0 - nodeVar18.y );

			} else {

				nodeVar16 = nodeVar15;

			}

			nodeVar19 = texture( nodeUniform0, nodeVar16 ).x;
			sampleViewPosition = ( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( sampleUV.x, ( 1.0 - sampleUV.y ), nodeVar19 ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).xyz / vec3( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( sampleUV.x, ( 1.0 - sampleUV.y ), nodeVar19 ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).w ) );
			pixelToSample = normalize( ( sampleViewPosition - viewPosition ) );

			if ( ( true == true ) ) {


				if ( ( true == true ) ) {

					nodeVar21 = 1.0;

				} else {

					nodeVar21 = -1.0;

				}

				nodeVar23 = bool( f_useLinearThickness );

				if ( ( nodeVar23 == true ) ) {

					nodeVar22 = ( clamp( ( ( - sampleViewPosition.z ) / f__cameraFar ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar22 = 1.0;

				}

				nodeVar20 = clamp( ( ( ( vec2( nodeVar21 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample, viewDir ), dot( normalize( ( ( sampleViewPosition - ( ( vec3( nodeVar22 ) * viewDir ) * vec3( THICKNESS ) ) ) - viewPosition ) ), viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - 1.5707963267948966 ) ) ) / vec2( 3.141592653589793 ) ), vec2( 0.0 ), vec2( 1.0 ) ).yx;

			} else {


				if ( ( true == true ) ) {

					nodeVar24 = 1.0;

				} else {

					nodeVar24 = -1.0;

				}

				nodeVar26 = bool( f_useLinearThickness );

				if ( ( nodeVar26 == true ) ) {

					nodeVar25 = ( clamp( ( ( - sampleViewPosition.z ) / f__cameraFar ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar25 = 1.0;

				}

				nodeVar20 = clamp( ( ( ( vec2( nodeVar24 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample, viewDir ), dot( normalize( ( ( sampleViewPosition - ( ( vec3( nodeVar25 ) * viewDir ) * vec3( THICKNESS ) ) ) - viewPosition ) ), viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - 1.5707963267948966 ) ) ) / vec2( 3.141592653589793 ) ), vec2( 0.0 ), vec2( 1.0 ) );

			}

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
			nodeVar28 = ( ( angleHorizonBitfield << startHorizonInt ) & (~nodeVar0) );
			nodeVar0 = ( nodeVar0 | nodeVar28 );
			nodeVar29 = bitCount( nodeVar28 );

			if ( ( float( nodeVar29 ) > 0.0 ) ) {

				nodeVar30 = sampleUV;
				nodeVar32 = bool( f_nodeUniform23 );

				if ( nodeVar32 ) {

					nodeVar33 = nodeVar30;
					nodeVar31 = vec2( nodeVar33.x, 1.0 - nodeVar33.y );

				} else {

					nodeVar31 = nodeVar30;

				}

				nodeVar34 = texture( lightColor, nodeVar31 );

				if ( ( dot( nodeVar34, vec4( vec3( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {

					nodeVar35 = normalize( pixelToSample );
					nodeVar36 = clamp( dot( viewNormal, nodeVar35 ), 0.0, 1.0 );

					if ( ( nodeVar36 > 0.001 ) ) {

						nodeVar38 = sampleUV;
						nodeVar40 = bool( f_nodeUniform24 );

						if ( nodeVar40 ) {

							nodeVar41 = nodeVar38;
							nodeVar39 = vec2( nodeVar41.x, 1.0 - nodeVar41.y );

						} else {

							nodeVar39 = nodeVar38;

						}

						nodeVar42 = texture( nodeUniform3, nodeVar39 );
						nodeVar43 = normalize( ( ( nodeVar42 * vec4( 2.0 ) ) - vec4( 1.0 ) ).xyz );

						if ( ( ( BACKFACE_LIGHTING > 0.0 ) && ( dot( nodeVar43, viewDir ) > 0.0 ) ) ) {

							nodeVar45 = dot( nodeVar43, ( - nodeVar35 ) );

							if ( ( sign( nodeVar45 ) < 0.0 ) ) {

								nodeVar44 = ( abs( nodeVar45 ) * BACKFACE_LIGHTING );

							} else {

								nodeVar44 = abs( nodeVar45 );

							}

							nodeVar37 = nodeVar44;

						} else {

							nodeVar37 = clamp( dot( nodeVar43, ( - nodeVar35 ) ), 0.0, 1.0 );

						}

						color_1 = ( vec4( color_1, 1.0 ) + ( ( ( vec4( ( float( nodeVar29 ) / 32.0 ) ) * nodeVar34 ) * vec4( nodeVar36 ) ) * vec4( nodeVar37 ) ) ).xyz;
						

					}

					

				}

				

			}

			lastSampleViewPosition = sampleViewPosition;

		}

		nodeVar46 = color_1;
		color = ( color + nodeVar46 );
		STEP_COUNT_1 = f_stepCount;
		EXP_FACTOR_1 = f_expFactor;
		THICKNESS_1 = f_thickness;
		BACKFACE_LIGHTING_1 = f_backfaceLighting;
		stepRadius_1 = 0.0;

		if ( ( nodeVar11 == true ) ) {

			stepRadius_1 = ( ( RADIUS * ( f__resolution.x / 2.0 ) ) / 16.0 );
			

		} else {

			stepRadius_1 = max( ( ( RADIUS * f__halfProjScale ) / ( - viewPosition.z ) ), float( STEP_COUNT_1 ) );
			

		}

		stepRadius_1 = ( stepRadius_1 / ( float( STEP_COUNT_1 ) + 1.0 ) );
		color_2 = vec3( 0.0, 0.0, 0.0 );
		lastSampleViewPosition_1 = viewPosition;

		for ( uint i = 0u; i < STEP_COUNT_1; i ++ ) {

			nodeVar47 = ( max( 1.0, float( ( STEP_COUNT_1 - 1u ) ) ) * stepRadius_1 );
			offset_1 = ( pow( abs( ( ( stepRadius_1 * ( float( i ) + nodeVar12 ) ) / nodeVar47 ) ), EXP_FACTOR_1 ) * nodeVar47 );
			uvOffset_1 = ( slideDirTexelSize * vec2( max( offset_1, ( float( i ) + 1.0 ) ) ) );

			if ( ( false == true ) ) {

				nodeVar48 = vec2( 1.0, -1.0 );

			} else {

				nodeVar48 = vec2( -1.0, 1.0 );

			}

			sampleUV_1 = ( nodeVarying3 + ( uvOffset_1 * nodeVar48 ) );

			if ( ( ( ( ( sampleUV_1.x <= 0.0 ) || ( sampleUV_1.y <= 0.0 ) ) || ( sampleUV_1.x >= 1.0 ) ) || ( sampleUV_1.y >= 1.0 ) ) ) {

				break;
				

			}

			nodeVar49 = sampleUV_1;
			nodeVar51 = bool( f_nodeUniform25 );

			if ( nodeVar51 ) {

				nodeVar52 = nodeVar49;
				nodeVar50 = vec2( nodeVar52.x, 1.0 - nodeVar52.y );

			} else {

				nodeVar50 = nodeVar49;

			}

			nodeVar53 = texture( nodeUniform0, nodeVar50 ).x;
			sampleViewPosition_1 = ( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( sampleUV_1.x, ( 1.0 - sampleUV_1.y ), nodeVar53 ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).xyz / vec3( ( f__cameraProjectionMatrixInverse * vec4( ( ( vec3( sampleUV_1.x, ( 1.0 - sampleUV_1.y ), nodeVar53 ) * vec3( 2.0 ) ) - vec3( 1.0 ) ), 1.0 ) ).w ) );
			pixelToSample_1 = normalize( ( sampleViewPosition_1 - viewPosition ) );

			if ( ( false == true ) ) {


				if ( ( false == true ) ) {

					nodeVar55 = 1.0;

				} else {

					nodeVar55 = -1.0;

				}

				nodeVar57 = bool( f_useLinearThickness );

				if ( ( nodeVar57 == true ) ) {

					nodeVar56 = ( clamp( ( ( - sampleViewPosition_1.z ) / f__cameraFar ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar56 = 1.0;

				}

				nodeVar54 = clamp( ( ( ( vec2( nodeVar55 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample_1, viewDir ), dot( normalize( ( ( sampleViewPosition_1 - ( ( vec3( nodeVar56 ) * viewDir ) * vec3( THICKNESS_1 ) ) ) - viewPosition ) ), viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - 1.5707963267948966 ) ) ) / vec2( 3.141592653589793 ) ), vec2( 0.0 ), vec2( 1.0 ) ).yx;

			} else {


				if ( ( false == true ) ) {

					nodeVar58 = 1.0;

				} else {

					nodeVar58 = -1.0;

				}

				nodeVar60 = bool( f_useLinearThickness );

				if ( ( nodeVar60 == true ) ) {

					nodeVar59 = ( clamp( ( ( - sampleViewPosition_1.z ) / f__cameraFar ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar59 = 1.0;

				}

				nodeVar54 = clamp( ( ( ( vec2( nodeVar58 ) * ( - GTAOFastAcos( clamp( vec2( dot( pixelToSample_1, viewDir ), dot( normalize( ( ( sampleViewPosition_1 - ( ( vec3( nodeVar59 ) * viewDir ) * vec3( THICKNESS_1 ) ) ) - viewPosition ) ), viewDir ) ), vec2( -1.0 ), vec2( 1.0 ) ) ) ) ) - vec2( ( n - 1.5707963267948966 ) ) ) / vec2( 3.141592653589793 ) ), vec2( 0.0 ), vec2( 1.0 ) );

			}

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
			nodeVar62 = ( ( angleHorizonBitfield_1 << startHorizonInt_1 ) & (~nodeVar0) );
			nodeVar0 = ( nodeVar0 | nodeVar62 );
			nodeVar63 = bitCount( nodeVar62 );

			if ( ( float( nodeVar63 ) > 0.0 ) ) {

				nodeVar64 = sampleUV_1;
				nodeVar66 = bool( f_nodeUniform26 );

				if ( nodeVar66 ) {

					nodeVar67 = nodeVar64;
					nodeVar65 = vec2( nodeVar67.x, 1.0 - nodeVar67.y );

				} else {

					nodeVar65 = nodeVar64;

				}

				nodeVar68 = texture( lightColor, nodeVar65 );

				if ( ( dot( nodeVar68, vec4( vec3( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {

					nodeVar69 = normalize( pixelToSample_1 );
					nodeVar70 = clamp( dot( viewNormal, nodeVar69 ), 0.0, 1.0 );

					if ( ( nodeVar70 > 0.001 ) ) {

						nodeVar72 = sampleUV_1;
						nodeVar74 = bool( f_nodeUniform27 );

						if ( nodeVar74 ) {

							nodeVar75 = nodeVar72;
							nodeVar73 = vec2( nodeVar75.x, 1.0 - nodeVar75.y );

						} else {

							nodeVar73 = nodeVar72;

						}

						nodeVar76 = texture( nodeUniform3, nodeVar73 );
						nodeVar77 = normalize( ( ( nodeVar76 * vec4( 2.0 ) ) - vec4( 1.0 ) ).xyz );

						if ( ( ( BACKFACE_LIGHTING_1 > 0.0 ) && ( dot( nodeVar77, viewDir ) > 0.0 ) ) ) {

							nodeVar79 = dot( nodeVar77, ( - nodeVar69 ) );

							if ( ( sign( nodeVar79 ) < 0.0 ) ) {

								nodeVar78 = ( abs( nodeVar79 ) * BACKFACE_LIGHTING_1 );

							} else {

								nodeVar78 = abs( nodeVar79 );

							}

							nodeVar71 = nodeVar78;

						} else {

							nodeVar71 = clamp( dot( nodeVar77, ( - nodeVar69 ) ), 0.0, 1.0 );

						}

						color_2 = ( vec4( color_2, 1.0 ) + ( ( ( vec4( ( float( nodeVar63 ) / 32.0 ) ) * nodeVar68 ) * vec4( nodeVar70 ) ) * vec4( nodeVar71 ) ) ).xyz;
						

					}

					

				}

				

			}

			lastSampleViewPosition_1 = sampleViewPosition_1;

		}

		nodeVar80 = color_2;
		color = ( color + nodeVar80 );
		ao = ( ao + ( float( bitCount( nodeVar0 ) ) / 32.0 ) );

	}

	ao = ( ao / float( ROTATION_COUNT ) );
	ao = clamp( pow( ( 1.0 - clamp( ao, 0.0, 1.0 ) ), AO_INTENSITY ), 0.0, 1.0 );
	color = ( color / vec3( float( ROTATION_COUNT ) ) );
	color = ( color * vec3( GI_INTENSITY ) );
	maxLuminance = 7.0;
	nodeVar82 = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );

	if ( ( nodeVar82 > maxLuminance ) ) {

		nodeVar81 = ( maxLuminance / nodeVar82 );

	} else {

		nodeVar81 = 1.0;

	}

	color = ( color * vec3( nodeVar81 ) );

	// result
	fragColor = vec4( color, ao );

}
