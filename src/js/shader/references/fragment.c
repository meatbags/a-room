// Three.js r181 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location(0) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0 : texture_depth_2d;
@binding( 2 ) @group( 1 ) var nodeUniform2_sampler : sampler;
@binding( 3 ) @group( 1 ) var nodeUniform2 : texture_2d<f32>;
@binding( 4 ) @group( 1 ) var nodeUniform18_sampler : sampler;
@binding( 5 ) @group( 1 ) var nodeUniform18 : texture_2d<f32>;
struct objectStruct {
	_cameraProjectionMatrixInverse : mat4x4<f32>,
	sliceCount : u32,
	aoIntensity : f32,
	giIntensity : f32,
	radius : f32,
	_temporalDirection : f32,
	_resolution : vec2<f32>,
	stepCount : u32,
	expFactor : f32,
	thickness : f32,
	backfaceLighting : f32,
	useScreenSpaceSampling : u32,
	_halfProjScale : f32,
	_temporalOffset : f32,
	useLinearThickness : u32,
	nodeUniform17 : f32
};
@binding( 1 ) @group( 1 )
var<uniform> object : objectStruct;

// codes
fn tsl_clampWrapping_float( coord: f32 ) -> f32 { return clamp( coord, 0.0, 1.0 ); }
fn tsl_coord_clampS_clamp_2dT( coord : vec2f ) -> vec2f {

	return vec2f(
		tsl_clampWrapping_float( coord.x ),
		tsl_clampWrapping_float( coord.y )
	);

}

fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {




	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}

fn spatialOffsets ( position : vec2<f32> ) -> f32 {




	return ( 0.25 * f32( ( i32( ( position.y - position.x ) ) & 3 ) ) );

}

fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn GTAOFastAcos ( value : vec2<f32> ) -> vec2<f32> {

	var nodeVar0 : vec2<f32>;
	var nodeVar1 : f32;
	var nodeVar2 : f32;

	nodeVar0 = ( ( abs( value ) * vec2<f32>( -0.156583 ) ) + vec2<f32>( 1.5707963267948966 ) );
	nodeVar0 = ( nodeVar0 * sqrt( ( vec2<f32>( 1.0 ) - abs( value ) ) ) );

	if ( ( value.x >= 0.0 ) ) {

		nodeVar1 = nodeVar0.x;

	} else {

		nodeVar1 = ( 3.141592653589793 - nodeVar0.x );

	}


	if ( ( value.y >= 0.0 ) ) {

		nodeVar2 = nodeVar0.y;

	} else {

		nodeVar2 = ( 3.141592653589793 - nodeVar0.y );

	}


	return vec2<f32>( nodeVar1, nodeVar2 );

}

fn bitCount ( value : u32 ) -> u32 {

	var nodeVar0 : u32;

	nodeVar0 = value;
	nodeVar0 = ( nodeVar0 - ( ( nodeVar0 >> 1u ) & 1431655765u ) );
	nodeVar0 = ( ( nodeVar0 & 858993459u ) + ( ( nodeVar0 >> 2u ) & 858993459u ) );

	return ( ( ( ( nodeVar0 + ( nodeVar0 >> 4u ) ) & 252645135u ) * 16843009u ) >> 24u );

}



@fragment
fn main( @location( 3 ) nodeVarying3 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// vars
	
	var nodeVar0 : u32;
	var nodeVar1 : f32;
	var nodeVar2 : vec2<u32>;
	var nodeVar3 : f32;
	var nodeVar4 : vec3<f32>;
	var nodeVar5 : vec4<f32>;
	var nodeVar6 : vec3<f32>;
	var nodeVar7 : vec3<f32>;
	var nodeVar8 : f32;
	var nodeVar9 : vec3<f32>;
	var nodeVar10 : f32;
	var nodeVar11 : bool;
	var nodeVar12 : vec3<f32>;
	var nodeVar13 : vec3<f32>;
	var nodeVar14 : f32;
	var nodeVar15 : f32;
	var nodeVar16 : vec2<f32>;
	var nodeVar17 : f32;
	var nodeVar18 : vec2<f32>;
	var nodeVar19 : f32;
	var nodeVar20 : f32;
	var nodeVar21 : bool;
	var nodeVar22 : f32;
	var nodeVar23 : f32;
	var nodeVar24 : bool;
	var nodeVar25 : u32;
	var nodeVar26 : u32;
	var nodeVar27 : u32;
	var nodeVar28 : vec4<f32>;
	var nodeVar29 : vec3<f32>;
	var nodeVar30 : f32;
	var nodeVar31 : f32;
	var nodeVar32 : vec4<f32>;
	var nodeVar33 : vec3<f32>;
	var nodeVar34 : f32;
	var nodeVar35 : f32;
	var nodeVar36 : vec3<f32>;
	var nodeVar37 : f32;
	var nodeVar38 : vec3<f32>;
	var nodeVar39 : vec3<f32>;
	var nodeVar40 : f32;
	var nodeVar41 : vec2<f32>;
	var nodeVar42 : f32;
	var nodeVar43 : vec2<f32>;
	var nodeVar44 : f32;
	var nodeVar45 : f32;
	var nodeVar46 : bool;
	var nodeVar47 : f32;
	var nodeVar48 : f32;
	var nodeVar49 : bool;
	var nodeVar50 : u32;
	var nodeVar51 : u32;
	var nodeVar52 : u32;
	var nodeVar53 : vec4<f32>;
	var nodeVar54 : vec3<f32>;
	var nodeVar55 : f32;
	var nodeVar56 : f32;
	var nodeVar57 : vec4<f32>;
	var nodeVar58 : vec3<f32>;
	var nodeVar59 : f32;
	var nodeVar60 : f32;
	var nodeVar61 : vec3<f32>;
	var nodeVar62 : f32;
	var nodeVar63 : f32;


	// flow
	// code

	nodeVar0 = 0u;
	nodeVar2 = textureDimensions( nodeUniform0, u32( 0 ) );
	nodeVar1 = textureLoad( nodeUniform0, vec2<u32>( tsl_coord_clampS_clamp_2dT( nodeVarying3 ) * vec2<f32>( nodeVar2 ) ), u32( 0 ) );
	nodeVar3 = nodeVar1;

	if ( ( nodeVar3 >= 1.0 ) ) {

		discard;
		

	}

	nodeVar4 = ( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeVarying3.x, ( 1.0 - nodeVarying3.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar3 ), 1.0 ) ).xyz / vec3<f32>( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeVarying3.x, ( 1.0 - nodeVarying3.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar3 ), 1.0 ) ).w ) );
	nodeVar5 = textureSample( nodeUniform2, nodeUniform2_sampler, nodeVarying3 );
	nodeVar6 = normalize( ( ( nodeVar5 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) ).xyz );
	nodeVar7 = normalize( ( - nodeVar4 ) );
	nodeVar8 = 0.0;
	nodeVar9 = vec3<f32>( 0.0, 0.0, 0.0 );
	let nodeConst0 = object.sliceCount;
	let nodeConst1 = object.aoIntensity;
	let nodeConst2 = object.giIntensity;
	let nodeConst3 = object.radius;

	for ( var i : u32 = 0u; i < nodeConst0; i ++ ) {

		let nodeConst4 = ( ( ( f32( i ) + interleavedGradientNoise( fragCoord.xy ) ) + object._temporalDirection ) * ( 3.141592653589793 / f32( nodeConst0 ) ) );
		let nodeConst5 = vec3<f32>( vec2<f32>( cos( nodeConst4 ), sin( nodeConst4 ) ), 0.0 );
		let nodeConst6 = ( nodeConst5.xy * ( vec2<f32>( 1.0 ) / object._resolution ) );
		let nodeConst7 = normalize( cross( nodeConst5, nodeVar7 ) );
		let nodeConst8 = cross( nodeVar7, nodeConst7 );
		let nodeConst9 = ( nodeVar6 - ( nodeConst7 * vec3<f32>( dot( nodeVar6, nodeConst7 ) ) ) );
		let nodeConst10 = normalize( nodeConst9 );
		let nodeConst11 = clamp( dot( nodeConst10, nodeVar7 ), -1.0, 1.0 );
		let nodeConst12 = ( ( - sign( dot( nodeConst9, nodeConst8 ) ) ) * acos( nodeConst11 ) );
		nodeVar0 = 0u;
		let nodeConst13 = object.stepCount;
		let nodeConst14 = object.expFactor;
		let nodeConst15 = object.thickness;
		let nodeConst16 = object.backfaceLighting;
		nodeVar10 = 0.0;
		nodeVar11 = bool( object.useScreenSpaceSampling );

		if ( ( nodeVar11 == true ) ) {

			nodeVar10 = ( ( nodeConst3 * ( object._resolution.x / 2.0 ) ) / 16.0 );
			

		} else {

			nodeVar10 = max( ( ( nodeConst3 * object._halfProjScale ) / ( - nodeVar4.z ) ), f32( nodeConst13 ) );
			

		}

		nodeVar10 = ( nodeVar10 / ( f32( nodeConst13 ) + 1.0 ) );
		nodeVar12 = vec3<f32>( 0.0, 0.0, 0.0 );
		nodeVar13 = nodeVar4;

		for ( var i : u32 = 0u; i < nodeConst13; i ++ ) {

			nodeVar14 = ( fract( ( spatialOffsets( fragCoord.xy ) + object._temporalOffset ) ) + fract( ( sin( tsl_mod_float( dot( ( ( ( nodeVarying3 + vec2<f32>( ( object._temporalDirection * 0.02 ) ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), vec2<f32>( 12.9898, 78.233 ) ), 3.141592653589793 ) ) * 43758.5453 ) ) );
			nodeVar15 = ( max( 1.0, f32( ( nodeConst13 - 1u ) ) ) * nodeVar10 );
			let nodeConst17 = ( pow( abs( ( ( nodeVar10 * ( f32( i ) + nodeVar14 ) ) / nodeVar15 ) ), nodeConst14 ) * nodeVar15 );
			let nodeConst18 = ( nodeConst6 * vec2<f32>( max( nodeConst17, ( f32( i ) + 1.0 ) ) ) );

			if ( ( true == true ) ) {

				nodeVar16 = vec2<f32>( 1.0, -1.0 );

			} else {

				nodeVar16 = vec2<f32>( -1.0, 1.0 );

			}

			let nodeConst19 = ( nodeVarying3 + ( nodeConst18 * nodeVar16 ) );

			if ( ( ( ( ( nodeConst19.x <= 0.0 ) || ( nodeConst19.y <= 0.0 ) ) || ( nodeConst19.x >= 1.0 ) ) || ( nodeConst19.y >= 1.0 ) ) ) {

				break;
				

			}

			nodeVar17 = textureLoad( nodeUniform0, vec2<u32>( tsl_coord_clampS_clamp_2dT( nodeConst19 ) * vec2<f32>( nodeVar2 ) ), u32( 0 ) );
			let nodeConst20 = ( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeConst19.x, ( 1.0 - nodeConst19.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar17 ), 1.0 ) ).xyz / vec3<f32>( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeConst19.x, ( 1.0 - nodeConst19.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar17 ), 1.0 ) ).w ) );
			let nodeConst21 = normalize( ( nodeConst20 - nodeVar4 ) );

			if ( ( true == true ) ) {


				if ( ( true == true ) ) {

					nodeVar19 = 1.0;

				} else {

					nodeVar19 = -1.0;

				}

				nodeVar21 = bool( object.useLinearThickness );

				if ( ( nodeVar21 == true ) ) {

					nodeVar20 = ( clamp( ( ( - nodeConst20.z ) / object.nodeUniform17 ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar20 = 1.0;

				}

				nodeVar18 = clamp( ( ( ( vec2<f32>( nodeVar19 ) * ( - GTAOFastAcos( clamp( vec2<f32>( dot( nodeConst21, nodeVar7 ), dot( normalize( ( ( nodeConst20 - ( ( vec3<f32>( nodeVar20 ) * nodeVar7 ) * vec3<f32>( nodeConst15 ) ) ) - nodeVar4 ) ), nodeVar7 ) ), vec2<f32>( -1.0 ), vec2<f32>( 1.0 ) ) ) ) ) - vec2<f32>( ( nodeConst12 - 1.5707963267948966 ) ) ) / vec2<f32>( 3.141592653589793 ) ), vec2<f32>( 0.0 ), vec2<f32>( 1.0 ) ).yx;

			} else {


				if ( ( true == true ) ) {

					nodeVar22 = 1.0;

				} else {

					nodeVar22 = -1.0;

				}

				nodeVar24 = bool( object.useLinearThickness );

				if ( ( nodeVar24 == true ) ) {

					nodeVar23 = ( clamp( ( ( - nodeConst20.z ) / object.nodeUniform17 ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar23 = 1.0;

				}

				nodeVar18 = clamp( ( ( ( vec2<f32>( nodeVar22 ) * ( - GTAOFastAcos( clamp( vec2<f32>( dot( nodeConst21, nodeVar7 ), dot( normalize( ( ( nodeConst20 - ( ( vec3<f32>( nodeVar23 ) * nodeVar7 ) * vec3<f32>( nodeConst15 ) ) ) - nodeVar4 ) ), nodeVar7 ) ), vec2<f32>( -1.0 ), vec2<f32>( 1.0 ) ) ) ) ) - vec2<f32>( ( nodeConst12 - 1.5707963267948966 ) ) ) / vec2<f32>( 3.141592653589793 ) ), vec2<f32>( 0.0 ), vec2<f32>( 1.0 ) );

			}

			let nodeConst22 = nodeVar18.x;
			let nodeConst23 = nodeVar18.y;
			let nodeConst24 = u32( ( nodeVar18 * vec2<f32>( 32.0 ) ).x );
			let nodeConst25 = u32( ceil( ( ( nodeConst23 - nodeConst22 ) * 32.0 ) ) );

			if ( ( nodeConst25 > 0u ) ) {

				nodeVar25 = ( 4294967295u >> ( ( 32u - 32u ) + ( 32u - nodeConst25 ) ) );

			} else {

				nodeVar25 = 0u;

			}

			let nodeConst26 = nodeVar25;
			nodeVar26 = ( ( nodeConst26 << nodeConst24 ) & (~nodeVar0) );
			nodeVar0 = ( nodeVar0 | nodeVar26 );
			nodeVar27 = bitCount( nodeVar26 );

			if ( ( f32( nodeVar27 ) > 0.0 ) ) {

				nodeVar28 = textureSample( nodeUniform18, nodeUniform18_sampler, nodeConst19 );

				if ( ( dot( nodeVar28, vec4<f32>( vec3<f32>( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {

					nodeVar29 = normalize( nodeConst21 );
					nodeVar30 = clamp( dot( nodeVar6, nodeVar29 ), 0.0, 1.0 );

					if ( ( nodeVar30 > 0.001 ) ) {

						nodeVar32 = textureSample( nodeUniform2, nodeUniform2_sampler, nodeConst19 );
						nodeVar33 = normalize( ( ( nodeVar32 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) ).xyz );

						if ( ( ( nodeConst16 > 0.0 ) && ( dot( nodeVar33, nodeVar7 ) > 0.0 ) ) ) {

							nodeVar35 = dot( nodeVar33, ( - nodeVar29 ) );

							if ( ( sign( nodeVar35 ) < 0.0 ) ) {

								nodeVar34 = ( abs( nodeVar35 ) * nodeConst16 );

							} else {

								nodeVar34 = abs( nodeVar35 );

							}

							nodeVar31 = nodeVar34;

						} else {

							nodeVar31 = clamp( dot( nodeVar33, ( - nodeVar29 ) ), 0.0, 1.0 );

						}

						nodeVar12 = ( vec4<f32>( nodeVar12, 1.0 ) + ( ( ( vec4<f32>( ( f32( nodeVar27 ) / 32.0 ) ) * nodeVar28 ) * vec4<f32>( nodeVar30 ) ) * vec4<f32>( nodeVar31 ) ) ).xyz;
						

					}

					

				}

				

			}

			nodeVar13 = nodeConst20;

		}

		nodeVar36 = nodeVar12;
		nodeVar9 = ( nodeVar9 + nodeVar36 );
		let nodeConst27 = object.stepCount;
		let nodeConst28 = object.expFactor;
		let nodeConst29 = object.thickness;
		let nodeConst30 = object.backfaceLighting;
		nodeVar37 = 0.0;

		if ( ( nodeVar11 == true ) ) {

			nodeVar37 = ( ( nodeConst3 * ( object._resolution.x / 2.0 ) ) / 16.0 );
			

		} else {

			nodeVar37 = max( ( ( nodeConst3 * object._halfProjScale ) / ( - nodeVar4.z ) ), f32( nodeConst27 ) );
			

		}

		nodeVar37 = ( nodeVar37 / ( f32( nodeConst27 ) + 1.0 ) );
		nodeVar38 = vec3<f32>( 0.0, 0.0, 0.0 );
		nodeVar39 = nodeVar4;

		for ( var i : u32 = 0u; i < nodeConst27; i ++ ) {

			nodeVar40 = ( max( 1.0, f32( ( nodeConst27 - 1u ) ) ) * nodeVar37 );
			let nodeConst31 = ( pow( abs( ( ( nodeVar37 * ( f32( i ) + nodeVar14 ) ) / nodeVar40 ) ), nodeConst28 ) * nodeVar40 );
			let nodeConst32 = ( nodeConst6 * vec2<f32>( max( nodeConst31, ( f32( i ) + 1.0 ) ) ) );

			if ( ( false == true ) ) {

				nodeVar41 = vec2<f32>( 1.0, -1.0 );

			} else {

				nodeVar41 = vec2<f32>( -1.0, 1.0 );

			}

			let nodeConst33 = ( nodeVarying3 + ( nodeConst32 * nodeVar41 ) );

			if ( ( ( ( ( nodeConst33.x <= 0.0 ) || ( nodeConst33.y <= 0.0 ) ) || ( nodeConst33.x >= 1.0 ) ) || ( nodeConst33.y >= 1.0 ) ) ) {

				break;
				

			}

			nodeVar42 = textureLoad( nodeUniform0, vec2<u32>( tsl_coord_clampS_clamp_2dT( nodeConst33 ) * vec2<f32>( nodeVar2 ) ), u32( 0 ) );
			let nodeConst34 = ( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeConst33.x, ( 1.0 - nodeConst33.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar42 ), 1.0 ) ).xyz / vec3<f32>( ( object._cameraProjectionMatrixInverse * vec4<f32>( vec3<f32>( ( ( vec2<f32>( nodeConst33.x, ( 1.0 - nodeConst33.y ) ) * vec2<f32>( 2.0 ) ) - vec2<f32>( 1.0 ) ), nodeVar42 ), 1.0 ) ).w ) );
			let nodeConst35 = normalize( ( nodeConst34 - nodeVar4 ) );

			if ( ( false == true ) ) {


				if ( ( false == true ) ) {

					nodeVar44 = 1.0;

				} else {

					nodeVar44 = -1.0;

				}

				nodeVar46 = bool( object.useLinearThickness );

				if ( ( nodeVar46 == true ) ) {

					nodeVar45 = ( clamp( ( ( - nodeConst34.z ) / object.nodeUniform17 ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar45 = 1.0;

				}

				nodeVar43 = clamp( ( ( ( vec2<f32>( nodeVar44 ) * ( - GTAOFastAcos( clamp( vec2<f32>( dot( nodeConst35, nodeVar7 ), dot( normalize( ( ( nodeConst34 - ( ( vec3<f32>( nodeVar45 ) * nodeVar7 ) * vec3<f32>( nodeConst29 ) ) ) - nodeVar4 ) ), nodeVar7 ) ), vec2<f32>( -1.0 ), vec2<f32>( 1.0 ) ) ) ) ) - vec2<f32>( ( nodeConst12 - 1.5707963267948966 ) ) ) / vec2<f32>( 3.141592653589793 ) ), vec2<f32>( 0.0 ), vec2<f32>( 1.0 ) ).yx;

			} else {


				if ( ( false == true ) ) {

					nodeVar47 = 1.0;

				} else {

					nodeVar47 = -1.0;

				}

				nodeVar49 = bool( object.useLinearThickness );

				if ( ( nodeVar49 == true ) ) {

					nodeVar48 = ( clamp( ( ( - nodeConst34.z ) / object.nodeUniform17 ), 0.0, 1.0 ) * 100.0 );

				} else {

					nodeVar48 = 1.0;

				}

				nodeVar43 = clamp( ( ( ( vec2<f32>( nodeVar47 ) * ( - GTAOFastAcos( clamp( vec2<f32>( dot( nodeConst35, nodeVar7 ), dot( normalize( ( ( nodeConst34 - ( ( vec3<f32>( nodeVar48 ) * nodeVar7 ) * vec3<f32>( nodeConst29 ) ) ) - nodeVar4 ) ), nodeVar7 ) ), vec2<f32>( -1.0 ), vec2<f32>( 1.0 ) ) ) ) ) - vec2<f32>( ( nodeConst12 - 1.5707963267948966 ) ) ) / vec2<f32>( 3.141592653589793 ) ), vec2<f32>( 0.0 ), vec2<f32>( 1.0 ) );

			}

			let nodeConst36 = nodeVar43.x;
			let nodeConst37 = nodeVar43.y;
			let nodeConst38 = u32( ( nodeVar43 * vec2<f32>( 32.0 ) ).x );
			let nodeConst39 = u32( ceil( ( ( nodeConst37 - nodeConst36 ) * 32.0 ) ) );

			if ( ( nodeConst39 > 0u ) ) {

				nodeVar50 = ( 4294967295u >> ( ( 32u - 32u ) + ( 32u - nodeConst39 ) ) );

			} else {

				nodeVar50 = 0u;

			}

			let nodeConst40 = nodeVar50;
			nodeVar51 = ( ( nodeConst40 << nodeConst38 ) & (~nodeVar0) );
			nodeVar0 = ( nodeVar0 | nodeVar51 );
			nodeVar52 = bitCount( nodeVar51 );

			if ( ( f32( nodeVar52 ) > 0.0 ) ) {

				nodeVar53 = textureSample( nodeUniform18, nodeUniform18_sampler, nodeConst33 );

				if ( ( dot( nodeVar53, vec4<f32>( vec3<f32>( 0.2126, 0.7152, 0.0722 ), 1.0 ) ) > 0.001 ) ) {

					nodeVar54 = normalize( nodeConst35 );
					nodeVar55 = clamp( dot( nodeVar6, nodeVar54 ), 0.0, 1.0 );

					if ( ( nodeVar55 > 0.001 ) ) {

						nodeVar57 = textureSample( nodeUniform2, nodeUniform2_sampler, nodeConst33 );
						nodeVar58 = normalize( ( ( nodeVar57 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) ).xyz );

						if ( ( ( nodeConst30 > 0.0 ) && ( dot( nodeVar58, nodeVar7 ) > 0.0 ) ) ) {

							nodeVar60 = dot( nodeVar58, ( - nodeVar54 ) );

							if ( ( sign( nodeVar60 ) < 0.0 ) ) {

								nodeVar59 = ( abs( nodeVar60 ) * nodeConst30 );

							} else {

								nodeVar59 = abs( nodeVar60 );

							}

							nodeVar56 = nodeVar59;

						} else {

							nodeVar56 = clamp( dot( nodeVar58, ( - nodeVar54 ) ), 0.0, 1.0 );

						}

						nodeVar38 = ( vec4<f32>( nodeVar38, 1.0 ) + ( ( ( vec4<f32>( ( f32( nodeVar52 ) / 32.0 ) ) * nodeVar53 ) * vec4<f32>( nodeVar55 ) ) * vec4<f32>( nodeVar56 ) ) ).xyz;
						

					}

					

				}

				

			}

			nodeVar39 = nodeConst34;

		}

		nodeVar61 = nodeVar38;
		nodeVar9 = ( nodeVar9 + nodeVar61 );
		nodeVar8 = ( nodeVar8 + ( f32( bitCount( nodeVar0 ) ) / 32.0 ) );

	}

	nodeVar8 = ( nodeVar8 / f32( nodeConst0 ) );
	nodeVar8 = clamp( pow( ( 1.0 - clamp( nodeVar8, 0.0, 1.0 ) ), nodeConst1 ), 0.0, 1.0 );
	nodeVar9 = ( nodeVar9 / vec3<f32>( f32( nodeConst0 ) ) );
	nodeVar9 = ( nodeVar9 * vec3<f32>( nodeConst2 ) );
	let nodeConst41 = 7.0;
	nodeVar63 = dot( nodeVar9, vec3<f32>( 0.2126, 0.7152, 0.0722 ) );

	if ( ( nodeVar63 > nodeConst41 ) ) {

		nodeVar62 = ( nodeConst41 / nodeVar63 );

	} else {

		nodeVar62 = 1.0;

	}

	nodeVar9 = ( nodeVar9 * vec3<f32>( nodeVar62 ) );

	// result

	output.color = vec4<f32>( nodeVar9, nodeVar8 );

	return output;

}
