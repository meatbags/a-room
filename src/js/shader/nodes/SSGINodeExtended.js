import SSGINode from 'three/addons/tsl/display/SSGINode';
import { clamp, normalize, reference, Fn, NodeUpdateType, uniform, vec4, passTexture, uv, logarithmicDepthToViewZ, viewZToPerspectiveDepth, getViewPosition, screenCoordinate, float, sub, fract, dot, vec2, rand, vec3, Loop, mul, PI, cos, sin, uint, cross, acos, sign, pow, luminance, If, max, abs, Break, sqrt, HALF_PI, div, ceil, shiftRight, convertToTexture, bool, getNormalFromDepth, countOneBits, interleavedGradientNoise } from 'three/tsl';

/**
 * 
 * Extended SSGINode. Adds range options.
 * 
 * @augments SSGINode
 */
class SSGINodeExtended extends SSGINode {
  /** */
	constructor( beautyNode, depthNode, normalNode, camera ) {
    super( beautyNode, depthNode, normalNode, camera );

    /** range */
    this.rangeStart = uniform(15, 'float');
    this.rangeStop = uniform(20, 'float');
	}

  setup( builder ) {

    // range
    const RANGE_START = this.rangeStart.mul(-1).toConst();
    const RANGE_STOP = this.rangeStop.mul(-1).toConst();
    const RANGE_SIZE = RANGE_STOP.sub(RANGE_START).toConst();
    
		const uvNode = uv();
		const MAX_RAY = uint( 32 );
		const globalOccludedBitfield = uint( 0 );

		const sampleDepth = ( uv ) => {

			const depth = this.depthNode.sample( uv ).r;

			if ( builder.renderer.logarithmicDepthBuffer === true ) {

				const viewZ = logarithmicDepthToViewZ( depth, this._cameraNear, this._cameraFar );

				return viewZToPerspectiveDepth( viewZ, this._cameraNear, this._cameraFar );

			}

			return depth;

		};

		const sampleNormal = ( uv ) => ( this.normalNode !== null ) ? this.normalNode.sample( uv ).rgb.normalize() : getNormalFromDepth( uv, this.depthNode.value, this._cameraProjectionMatrixInverse );
		const sampleBeauty = ( uv ) => this.beautyNode.sample( uv );

		// From Activision GTAO paper: https://www.activision.com/cdn/research/s2016_pbs_activision_occlusion.pptx

		const spatialOffsets = Fn( ( [ position ] ) => {

			return float( 0.25 ).mul( sub( position.y, position.x ).bitAnd( 3 ) );

		} ).setLayout( {
			name: 'spatialOffsets',
			type: 'float',
			inputs: [
				{ name: 'position', type: 'vec2' }
			]
		} );

		const GTAOFastAcos = Fn( ( [ value ] ) => {

			const outVal = abs( value ).mul( float( - 0.156583 ) ).add( HALF_PI );
			outVal.mulAssign( sqrt( abs( value ).oneMinus() ) );

			const x = value.x.greaterThanEqual( 0 ).select( outVal.x, PI.sub( outVal.x ) );
			const y = value.y.greaterThanEqual( 0 ).select( outVal.y, PI.sub( outVal.y ) );

			return vec2( x, y );

		} ).setLayout( {
			name: 'GTAOFastAcos',
			type: 'vec2',
			inputs: [
				{ name: 'value', type: 'vec2' }
			]
		} );

		const horizonSampling = Fn( ( [ directionIsRight, RADIUS, viewPosition, slideDirTexelSize, initialRayStep, uvNode, viewDir, viewNormal, n ] ) => {

			const STEP_COUNT = this.stepCount.toConst();
			const EXP_FACTOR = this.expFactor.toConst();
			const THICKNESS = this.thickness.toConst();
			const BACKFACE_LIGHTING = this.backfaceLighting.toConst();

			const stepRadius = float( 0 );

			If( this.useScreenSpaceSampling.equal( true ), () => {

				stepRadius.assign( RADIUS.mul( this._resolution.x.div( 2 ) ).div( float( 16 ) ) ); // SSRT3 has a bug where stepRadius is divided by STEP_COUNT twice; fix here

			} ).Else( () => {

				stepRadius.assign( max( RADIUS.mul( this._halfProjScale ).div( viewPosition.z.negate() ), float( STEP_COUNT ) ) ); // Port note: viewZ is negative so a negate is required

			} );

			stepRadius.divAssign( float( STEP_COUNT ).add( 1 ) );
			const radiusVS = max( 1, float( STEP_COUNT.sub( 1 ) ) ).mul( stepRadius );
			const uvDirection = directionIsRight.equal( true ).select( vec2( 1, - 1 ), vec2( - 1, 1 ) ); // Port note: Because of different uv conventions, uv-y has a different sign
			const samplingDirection = directionIsRight.equal( true ).select( 1, - 1 );

			const color = vec3( 0 );

			Loop( { start: uint( 0 ), end: STEP_COUNT, type: 'uint', condition: '<' }, ( { i } ) => {

				const offset = pow( abs( mul( stepRadius, float( i ).add( initialRayStep ) ).div( radiusVS ) ), EXP_FACTOR ).mul( radiusVS ).toConst();
				const uvOffset = slideDirTexelSize.mul( max( offset, float( i ).add( 1 ) ) ).toConst();
				const sampleUV = uvNode.add( uvOffset.mul( uvDirection ) ).toConst();

				If( sampleUV.x.lessThanEqual( 0 ).or( sampleUV.y.lessThanEqual( 0 ) ).or( sampleUV.x.greaterThanEqual( 1 ) ).or( sampleUV.y.greaterThanEqual( 1 ) ), () => {

					Break();

				} );

				const sampleViewPosition = getViewPosition( sampleUV, sampleDepth( sampleUV ), this._cameraProjectionMatrixInverse ).toConst();
				const pixelToSample = sampleViewPosition.sub( viewPosition ).normalize().toConst();
				const linearThicknessMultiplier = this.useLinearThickness.equal( true ).select( sampleViewPosition.z.negate().div( this._cameraFar ).clamp().mul( 100 ), float( 1 ) );
				const pixelToSampleBackface = normalize( sampleViewPosition.sub( linearThicknessMultiplier.mul( viewDir ).mul( THICKNESS ) ).sub( viewPosition ) );

				let frontBackHorizon = vec2( dot( pixelToSample, viewDir ), dot( pixelToSampleBackface, viewDir ) );
				frontBackHorizon = GTAOFastAcos( clamp( frontBackHorizon, - 1, 1 ) );
				frontBackHorizon = clamp( div( mul( samplingDirection, frontBackHorizon.negate() ).sub( n.sub( HALF_PI ) ), PI ) ); // Port note: subtract half pi instead of adding it
				frontBackHorizon = directionIsRight.equal( true ).select( frontBackHorizon.yx, frontBackHorizon.xy ); // Front/Back get inverted depending on angle

				// inline ComputeOccludedBitfield() for easier debugging

				const minHorizon = frontBackHorizon.x.toConst();
				const maxHorizon = frontBackHorizon.y.toConst();

				const startHorizonInt = uint( frontBackHorizon.mul( float( MAX_RAY ) ) ).toConst();
				const angleHorizonInt = uint( ceil( maxHorizon.sub( minHorizon ).mul( float( MAX_RAY ) ) ) ).toConst();
				const angleHorizonBitfield = angleHorizonInt.greaterThan( uint( 0 ) ).select( uint( shiftRight( uint( 0xFFFFFFFF ), uint( 32 ).sub( MAX_RAY ).add( MAX_RAY.sub( angleHorizonInt ) ) ) ), uint( 0 ) ).toConst();
				let currentOccludedBitfield = angleHorizonBitfield.shiftLeft( startHorizonInt );
				currentOccludedBitfield = currentOccludedBitfield.bitAnd( globalOccludedBitfield.bitNot() );

				globalOccludedBitfield.assign( globalOccludedBitfield.bitOr( currentOccludedBitfield ) );
				const numOccludedZones = countOneBits( currentOccludedBitfield );

				//

				If( numOccludedZones.greaterThan( 0 ), () => { // If a ray hit the sample, that sample is visible from shading point

					const lightColor = sampleBeauty( sampleUV );

					If( luminance( lightColor ).greaterThan( 0.001 ), () => { // Continue if there is light at that location (intensity > 0)

						const lightDirectionVS = normalize( pixelToSample );
						const normalDotLightDirection = clamp( dot( viewNormal, lightDirectionVS ) );

						If( normalDotLightDirection.greaterThan( 0.001 ), () => { // Continue if light is facing surface normal

							const lightNormalVS = sampleNormal( sampleUV );

							// Intensity of outgoing light in the direction of the shading point

							let lightNormalDotLightDirection = dot( lightNormalVS, lightDirectionVS.negate() );

							const d = sign( lightNormalDotLightDirection ).lessThan( 0 ).select( abs( lightNormalDotLightDirection ).mul( BACKFACE_LIGHTING ), abs( lightNormalDotLightDirection ) );
							lightNormalDotLightDirection = BACKFACE_LIGHTING.greaterThan( 0 ).and( dot( lightNormalVS, viewDir ).greaterThan( 0 ) ).select( d, clamp( lightNormalDotLightDirection ) );

							color.rgb.addAssign( float( numOccludedZones ).div( float( MAX_RAY ) ).mul( lightColor ).mul( normalDotLightDirection ).mul( lightNormalDotLightDirection ) );

						} );

					} );

				} );

			} );

			return vec3( color );

		} );

		const gi = Fn( () => {

			const depth = sampleDepth( uvNode ).toVar();

			depth.greaterThanEqual( 1.0 ).discard();

			const viewPosition = getViewPosition( uvNode, depth, this._cameraProjectionMatrixInverse ).toVar();
			const ao = float( 0 );
			const color = vec3( 0 );

			// check inside range
			If( viewPosition.z.greaterThanEqual( RANGE_STOP ), () => {
			
				const viewNormal = sampleNormal( uvNode ).toVar();
				const viewDir = normalize( viewPosition.xyz.negate() ).toVar();

				//

				const noiseOffset = spatialOffsets( screenCoordinate );
				const noiseDirection = interleavedGradientNoise( screenCoordinate );
				const noiseJitterIdx = this._temporalDirection.mul( 0.02 ); // Port: Add noiseJitterIdx here for slightly better noise convergence with TRAA (see #31890 for more details)
				const initialRayStep = fract( noiseOffset.add( this._temporalOffset ) ).add( rand( uvNode.add( noiseJitterIdx ).mul( 2 ).sub( 1 ) ) );

				const ROTATION_COUNT = this.sliceCount.toConst();
				const AO_INTENSITY = this.aoIntensity.toConst();
				const GI_INTENSITY = this.giIntensity.toConst();
				const RADIUS = this.radius.toConst();

				Loop( { start: uint( 0 ), end: ROTATION_COUNT, type: 'uint', condition: '<' }, ( { i } ) => {

					const rotationAngle = mul( float( i ).add( noiseDirection ).add( this._temporalDirection ), PI.div( float( ROTATION_COUNT ) ) ).toConst();
					const sliceDir = vec3( vec2( cos( rotationAngle ), sin( rotationAngle ) ), 0 ).toConst();
					const slideDirTexelSize = sliceDir.xy.mul( float( 1 ).div( this._resolution ) ).toConst();

					const planeNormal = normalize( cross( sliceDir, viewDir ) ).toConst();
					const tangent = cross( viewDir, planeNormal ).toConst();
					const projectedNormal = viewNormal.sub( planeNormal.mul( dot( viewNormal, planeNormal ) ) ).toConst();
					const projectedNormalNormalized = normalize( projectedNormal ).toConst();

					const cos_n = clamp( dot( projectedNormalNormalized, viewDir ), - 1, 1 ).toConst();
					const n = sign( dot( projectedNormal, tangent ) ).negate().mul( acos( cos_n ) ).toConst();

					globalOccludedBitfield.assign( 0 );

					color.addAssign( horizonSampling( bool( true ), RADIUS, viewPosition, slideDirTexelSize, initialRayStep, uvNode, viewDir, viewNormal, n ) );
					color.addAssign( horizonSampling( bool( false ), RADIUS, viewPosition, slideDirTexelSize, initialRayStep, uvNode, viewDir, viewNormal, n ) );

					ao.addAssign( float( countOneBits( globalOccludedBitfield ) ).div( float( MAX_RAY ) ) );

				} );

				ao.divAssign( float( ROTATION_COUNT ) );
				ao.assign( pow( ao.clamp().oneMinus(), AO_INTENSITY ).clamp() );

				color.divAssign( float( ROTATION_COUNT ) );
				color.mulAssign( GI_INTENSITY );

				// scale color based on luminance

				const maxLuminance = float( 7 ).toConst(); // 7 represent a HDR luminance value
				const currentLuminance = luminance( color );

				const scale = currentLuminance.greaterThan( maxLuminance ).select( maxLuminance.div( currentLuminance ), float( 1 ) );
				color.mulAssign( scale );

				// range fade out
				If( viewPosition.z.lessThan( RANGE_START ), () => {
					const fade = pow(
						viewPosition.z.sub( RANGE_START ).div( RANGE_SIZE ),
						2
					).toVar();
					color.mulAssign( fade.oneMinus() );
					ao.addAssign( float(1.0).sub(ao).mul(fade) );
				} );

			}).Else(() => {
				
				// outside range
				ao.assign(1.0);

			});

			return vec4( color, ao );

		} );

		this._material.fragmentNode = gi().context( builder.getSharedContext() );
		this._material.needsUpdate = true;

		//

		return this._textureNode;
	}
}

export default SSGINodeExtended;

export const ssgi_extended = ( beautyNode, depthNode, normalNode, camera ) => {
  return new SSGINodeExtended( convertToTexture( beautyNode ), depthNode, normalNode, camera );
};