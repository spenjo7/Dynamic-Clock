// Future: Allow for alternate radi ( staggered ) ? maybe even random within a range 
// 	2020-03-29: Version 1.1 - Making Into Classes  (with additional functionality)
	// Radius options are:
		/// n% - percent of parent div's shorter radius ( divide by 100 ) 
		/// npx - static pixle amount
		/// n.n - multiplicative factor of the parent div's shorter radius
	// Always, return an integer version of the px value 
		/// ex '50%' / 100 = 0.5 * 200 <200px parent_radius> = 100 <px>
		/// ex '100px' = 100 <px>
		/// ex: 0.5 * 200 <200px parent_radius> = 100 <px>
	
//  2020-03-29: Version 1.0 - (Stable)

class circleGenerator{
	constructor( parent_element, existing_elements = [], opts = {} ){
		// this is the element that will be hosting the circlularly placed items
		this.parentElement = parent_element;
		this.target_elements_array = existing_elements;
		this.radius = (opts && opts.radius)? opts.radius : null;
		this.topStart = (opts && opts.topStart)? opts.topStart : false;
		this.clockwise = (opts && opts.clockwise)? opts.clockwise : true; 
	}
	
	lesser( x,y ){
		return x < y ? x : y;
	} 
	
	calcCircleXY = ( angle, radius ) => { // start location agnostic
		// gets the X and Y coordinates of a point on a circle
			/// Angles start on the right unless topStarted

		let true_angle = this.topStart? angle - 90 : angle;
			true_angle = true_angle % 360; // prevent large numbers from messing with floating point

		let theta = true_angle * Math.PI / 180;

		return {
			x:  radius *  Math.cos( theta ),
			y:  radius * Math.sin( theta )
		}

	} 
	
	measureElement(element){ // used on both parent and target elements

		let out = {
			width: element.offsetWidth,
			height: element.offsetHeight,
			left: element.offsetLeft,
			top: element.offsetTop,
		};

		out.center = { 
			x: ( out.width / 2 ),
			y: ( out.height / 2 )
		}

		out.absolute_center = {
			x: out.center.x + out.left,
			y: out.center.y + out.top
		}

		out.lesser_side = this.lesser( out.width, out.height );
		out.lesser_half = this.lesser( out.center.x, out.center.y );

		return out;
	}
	
	dynamicRadius(){
		
		let parent_radius = this.measureElement(this.parentElement).lesser_half;
		let rgx_percent = /\d+(\.\d+)?%/;
		let rgx_px = /\d+(\.\d+)?px/i;
		let rgx_num = /\d+(\.\d+)?/;
		
		let new_radius = rgx_percent.test( this.radius )? 
			parseFloat( rgx_percent.exec( this.radius )[0] ) / 100 * parent_radius
			: null;
		
		new_radius = rgx_px.test( this.radius )? 
			parseFloat( rgx_px.exec( this.radius )[0] ) 
			: new_radius;
		
		new_radius = ( new_radius == null && rgx_num.test(this.radius) )? 
			parseFloat( rgx_num.exec(this.radius)[0] ) * parent_radius
			: new_radius;

		if( new_radius !== null ){
				//console.log(this.radius, new_radius); // testing and dev 
			return new_radius; // In case called by this.placeAroundCircle()
		}else {
			console.error( `ERROR: ${this.radius} is not a valid radius value `);
			return 0;
		}		
		
	}
	
	calcOffset( element ){
		let parent_center = this.measureElement( this.parentElement ).center;
		let own_center = this.measureElement(element).center;

		return {
			x: parent_center.x - own_center.x,
			y: parent_center.y - own_center.y
		}

	}

	dynamicPlaceXY( element , static_xy_obj  = { x:0, y:0 }, offset_xy_obj  = { x:0, y:0 } ){
		element.style.left = static_xy_obj.x + offset_xy_obj.x + 'px';
		element.style.top = static_xy_obj.y + offset_xy_obj.y + 'px';
	}

	placeAroundCircle(){ // placing and updating are same function 

		this.target_elements_array
			.forEach( (element,index,self) => {
				let elm_offset = this.calcOffset(element);

				let angle = 360 / self.length * (this.clockwise? index : index * -1);

				let circle_xy = this.calcCircleXY(angle,  this.dynamicRadius());
				this.dynamicPlaceXY( element, elm_offset, circle_xy );

			})

	}
	
	getElements( new_element_array ){ // can use as a pre-cursor for setting
		return this.target_elements_array;
	}
	
	setElements( new_element_array ){ // better to just replace entirely on change
		this.target_elements_array = new_element_array; 
	}
	
	setRadius( radius ){
		if( /\d+/.test(radius) ){
			this.radius = radius;
		} else {
			console.error( `ERROR: "${radius}" is an Invalid radius value`);
		}
		
	}

}
