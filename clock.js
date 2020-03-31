class Clock{
	constructor( analog_clock_div = null , digital_clock_div = null , options_object = {} ){
		this.analog_clock_div = analog_clock_div;
		this.digital_clock_div = digital_clock_div;
		this.options = {
			only_4: false, 
			inject_dots: true, 
			number_replace: false, 
			alternateArray : null,
			number_radius: 0.9,
			starting_clock_status: {
					mode: "realTime",
					running: true,
					update_speed: 100 //miliseconds for the setInterval
				},
			... options_object
		},
		
		this.clock_status = this.options.starting_clock_status;
			// Using duplication so that this doesn't require a special options object 
		this.hand_names = [ 'millisecond','hour','minute','second' ]; // will use multiple times
		this.handElements = null; /// use later when generating the elements
		this.numberPlacer = null;
		this.repeating_interval = null; 
	}
	
	genClockNumberDivs( ){ // possibly exeternal
		
		let faceNumbers = this.options.only_4? 
			[12,3,6,9] :
			[ 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
		
		
		faceNumbers = this.options.number_replace?
			faceNumbers.map( n => '*' )
			: faceNumbers;
		
		faceNumbers = this.options.alternateArray? this.options.alternateArray: faceNumbers;
		
		faceNumbers = this.options.inject_dots? 
			faceNumbers.map( n => [n,'.']).flat()
			: faceNumbers;
		
		faceNumbers = faceNumbers
			.map( el => {
				let div = document.createElement('div');
				div.innerText = el;
				div.classList.add('number');
				this.analog_clock_div.appendChild(div);
				return div; 
			})
			
		let clock_gen_opts = { topStart: true, radius: this.options.number_radius };
		
		this.numberPlacer = new circleGenerator(  this.analog_clock_div, faceNumbers, clock_gen_opts );
		
		this.updateFaceNumberPlacement();
	}
	
	genClockHandDivs(){ // possibly external 
		this.handElements = this.hand_names
			.map( hand => {
				let div = document.createElement('div');
				div.classList.add(hand);
				div.classList.add('hand');
				this.analog_clock_div.appendChild(div);
				return div;
			})
	}
	
	textifyNumber(n, leading_zero = true ){
		return leading_zero? 
			`0${n}`.slice(-2):
			`${n}`.slice(0,1);
	}
	
	calculated_timeToDegrees(calculated_time){
		let millisecond = ( Math.round(calculated_time.ms/25 )*9) +180;
		let second = (calculated_time.s*6) + (Math.round(calculated_time.ms/500)*3)+180;
		let minute = (calculated_time.m*6) + (Math.round(calculated_time.s/10))+180;
		let hour = (calculated_time.hs*30)+(Math.round(calculated_time.m/30))+180;
		return { millisecond, second, minute, hour};
	}
	
	convertToDigitalTime(calculated_time){
		let hr = this.textifyNumber( calculated_time.hs );
		let mn = this.textifyNumber( calculated_time.m );
		let sc = this.textifyNumber( calculated_time.s );
		let ms = this.textifyNumber( calculated_time.ms, false );
		return `${hr}:${mn}:${sc}.${ms}`;
	}
	
	updateAnalogClock( time_stamp ){ // external
		let degrees = this.calculated_timeToDegrees( time_stamp );
		[].slice.call( this.handElements ).map( (hand) => {
			hand.style.transform =`rotate(${degrees[hand.className.split(' ')[0]]}deg)`; 
		});
	}

	updateDigitalClock( time_stamp ){ // external 
		this.digital_clock_div.innerHTML = this.convertToDigitalTime( time_stamp );
	}
	
	updateFaceNumberPlacement(){
		this.numberPlacer.placeAroundCircle();

	}

	rand(max){
		return Math.ceil(Math.random()*max); 
	}

	randomClockTime(){ // can be external 
		let ms = this.rand(1000);
		let s = this.rand(60);
		let m = this.rand(60);
		let hs = this.rand(12);
		return {ms,s,m,hs};
		//return {ms:0,s:30,m:0,hs:0}; // use for testing of hand placements
	}

	realTime(){ // can be external 
		let d = new Date();
		return{
			ms: d.getMilliseconds(),
			s: d.getSeconds(),
			m: d.getMinutes(),
			hs: d.getHours()%12
		};
	}
	
	updateClocks( time = null ){ // can be external 
		time = time? time: this.realTime();
		if(this.analog_clock_div !== null ){
			this.updateAnalogClock( time );	
		}
		
		if(this.digital_clock_div !== null ){
			this.updateDigitalClock( time );
		}
	}
	
		//// Not Quite Sure If I want this; maybe for stopwatch?
	setClockStatus(opts){ // external
		let now_status = this.clock_status; 
			//Have to copy; this.___ can't be object re_structured
		this.clock_status = ( { now_status, ...opts} );
	}
	
	getIsRunning(){ // external
		return this.clock_status.running;
	}
	
	pauseStart( overide = null ){ // external 
			// return NEW value in case we want it to update something external
		let out =  overide !== null ?
			overide 
		: this.getIsRunning()? 
			false : true; // Toggles opposite
		
		this.clock_status.running = out;
		return out;
	}
	
	randomize(){
		// even though we could directly set this.clock_status.running; its probably better to only use 1 way to toggle it 
		this.pauseStart(false);
		this.updateClocks( this.randomClockTime() );
	}
	
	
	showHide( element, overide_value = null ){ 
		const vis_toggle = ( val = null, invert = false ) => { // return opposite of current 
			return ( val == null )? true // For first time per Element
				: val.includes('hidden'); 
		}
	
		// Out becomes NEW bool value 
		let	out = ( overide_value !== null )? overide_value // Use Absolute value 
				: vis_toggle( element.style.visibility ); // Else use Inverted value
			
			element.style.visibility = out ? "visible" : "hidden";
				
		return out; 
	}
	
	showHideDigitalDisplay( overide_value = null ){
		return this.showHide( this.digital_clock_div, overide_value );
	}
	
	showHideClockHands( hand_name = null, overide_value = null ){
		if( this.handElements !== null ){
			let hand_ind = hand_name?
				this.hand_names.indexOf( hand_name.trim().toLowerCase() ) : -1;
						
			if( hand_ind == -1 ){
				// there is no reason to toggle all to their opposites or toggle all off
				this.handElements.forEach( el => {
					this.showHide(el, true);
					el.classList.remove('noPseudo');
				})
				
			} else {
				// individual hands can be toggled or overriden
				let ev = this.showHide( this.handElements[hand_ind], overide_value );
				
				// can use a tererary as a stand alone if statement
				ev? this.handElements[hand_ind].classList.remove('noPseudo')
				  : this.handElements[hand_ind].classList.add('noPseudo');
	
			}
			
			let output = {};
			this.handElements
				.forEach( (el,ind) => {
					output[this.hand_names[ind]] = !el.style.visibility.includes('hidden');
				})
				
			return output;
		} else {
			return null 
		}
	}
	

	/*
		Restore /add features to:
			use as a stopwatch
	*/
	
	init(){
		if(this.analog_clock_div !== null ){
			this.genClockNumberDivs();
			this.genClockHandDivs();
		}
	
		this.updateClocks(); // incase we start out stopped
		
			// setInterval
		this.repeating_interval = setInterval( ()=>{			
		
			if( this.clock_status.running == true ){
				if( this.clock_status.mode == 'realTime'){
					this.updateClocks();
				}
		
			} // else do nothing
			
		
		}, this.clock_status.update_speed);
		
		// ResizeEvent
			/// Only the window is capable of having resize events (iFrames can as well??) 
		window.addEventListener('resize', (event) =>{ 
			event.preventDefault();
			this.updateFaceNumberPlacement();
			
			
		});
				
		return this; // that way Clock can be initialized upon instantiation
	}
	
}