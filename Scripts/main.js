$(() => {

	Vue.filter('time', value => `${value.h}:${("0" + value.m).slice(-2)}:${("0" + value.s).slice(-2)}`);
	Vue.filter('volume', (value, mute) => mute ? '' : `${value >= 0 ? '+' : ''}${value}db`);

	const timer = new Timer();	//TODO: https://tonejs.github.io/docs/#Clock
	const tapTimeout = 1000 * 4;
	let currentNote = 0;

	const app = new Vue({
		el: '#app',
		data: {
			isPlaying: false,
			time: {
				h: 0,
				m: 0,
				s: 0,
				ms: 0
			},
			bpm: 100,
			bpmMin: 10,
			bpmMax: 220,
			bpmIncrement: 10,
			bpmRamp: {
				from: 100,
				to: 100,
				interval: 60,
				timeEnabled: false,
				stepsEnabled: false,
				min: 5,
				max: 1200,
			},
			beats: 4,
			subunits: 4,
			mute: false,
			volume: 0,

			taps: [],
		},
		methods: {
			playPauseOnClick: function () {

				this.isPlaying = !this.isPlaying;
				switch (Tone.Transport.state) {

					case 'started':
						Tone.Transport.pause();
						timer.pause();
						return;

					case 'stopped':
						currentNote = 0;
						if (this.isbpmRampEnabled()) {
							this.bpm = this.bpmRamp.from;
						}
						// Have to do both for weird reasons :(
						Tone.Transport.bpm.value = this.bpm;
						Tone.Transport.bpm.setValueAtTime(this.bpm, Tone.now());
						if (this.bpmRamp.timeEnabled) {
							Tone.Transport.bpm.rampTo(this.bpmRamp.to, this.bpmRamp.interval);
						}
						//https://tonejs.github.io/docs/#types/Time
						Tone.Transport.scheduleRepeat(loop, "4n");
						break;

					case 'paused':
						break;

					default:
						throw new Error('Un-handled state: ' + Tone.Transport.state);
				}
				Tone.Transport.start();
				timer.start((h, m, s, ms) => this.time = { h, m, s, ms });
			},
			stopOnClick: function () {

				Tone.Transport.stop();
				Tone.Transport.cancel();
				timer.stop();
				this.time = {
					h: 0,
					m: 0,
					s: 0,
					ms: 0
				};
				this.isPlaying = false;
			},
			volumeDownOnClick: function () {

				this.mute = false;
				Tone.Master.mute = false;
				this.volume = Math.round(Math.max(this.volume - 3, -24));
				Tone.Master.volume.value = this.volume;
			},
			volumeUpOnClick: function () {

				this.mute = false;
				Tone.Master.mute = false;
				this.volume = Math.round(Math.min(this.volume + 3, 24));
				Tone.Master.volume.value = this.volume;
			},
			volumeOffOnClick: function () {

				this.mute = !this.mute;
				Tone.Master.mute = this.mute;
			},
			bpmIncreaseOnClick: function () {

				this.bpm = Math.max(Math.min(this.bpm + this.bpmIncrement, this.bpmMax), this.bpmMin);
				Tone.Transport.bpm.value = this.bpm;
				bpmSlider.bootstrapSlider('setValue', this.bpm);
			},
			bpmDecreaseOnClick: function () {

				this.bpm = Math.max(Math.min(this.bpm - this.bpmIncrement, this.bpmMax), this.bpmMin);
				Tone.Transport.bpm.value = this.bpm;
				bpmSlider.bootstrapSlider('setValue', this.bpm);
			},
			bpmTapOnClick: function () {

				const now = new Date().getTime();
				if (this.taps.length > 0 && (now - this.taps[this.taps.length - 1]) > tapTimeout) {
					this.taps = [];
					this.bpm = 100;
				}
				this.taps.push(now);
				if (this.taps.length === 1) {
					return;
				}
				const tapsDifference = [];
				for (let index = 1; index < this.taps.length; index++) {
					tapsDifference.push(this.taps[index] - this.taps[index - 1]);
				}
				const avg = (tapsDifference.reduce((a, b) => a + b) / tapsDifference.length);
				this.bpm = Math.round((1000 * 60) / avg);
				Tone.Transport.bpm.value = this.bpm;
			},
			isbpmRampEnabled: function () {

				return this.bpmRamp.timeEnabled || this.bpmRamp.stepsEnabled;
			},
			bpmTimeEnabledOnClick: function () {

				this.bpmRamp.stepsEnabled = false;
				this.isbpmRampEnabled() ? bpmSlider.bootstrapSlider('disable') : bpmSlider.bootstrapSlider('enable');
			},
			bpmStepsEnabledOnClick: function () {

				this.bpmRamp.timeEnabled = false;
				this.isbpmRampEnabled() ? bpmSlider.bootstrapSlider('disable') : bpmSlider.bootstrapSlider('enable');
			},
			bpmRampFromIncreaseOnClick: function () {

				this.bpmRamp.from = Math.max(Math.min(this.bpmRamp.from + this.bpmIncrement, this.bpmMax), this.bpmMin);
			},
			bpmRampFromDecreaseOnClick: function () {

				this.bpmRamp.from = Math.max(Math.min(this.bpmRamp.from - this.bpmIncrement, this.bpmMax), this.bpmMin);
			},
			bpmRampToIncreaseOnClick: function () {

				this.bpmRamp.to = Math.max(Math.min(this.bpmRamp.to + this.bpmIncrement, this.bpmMax), this.bpmMin);
			},
			bpmRampToDecreaseOnClick: function () {

				this.bpmRamp.to = Math.max(Math.min(this.bpmRamp.to - this.bpmIncrement, this.bpmMax), this.bpmMin);
			},
			bpmRampIncreaseOnClick: function () {

				this.bpmRamp.interval = Math.max(Math.min(this.bpmRamp.interval + 10, this.bpmRamp.max), this.bpmRamp.min);
			},
			bpmRampDecreaseOnClick: function () {

				this.bpmRamp.interval = Math.max(Math.min(this.bpmRamp.interval - 10, this.bpmRamp.max), this.bpmRamp.min);
			},
		}
	});

	// :: BPM Slider ::

	//https://github.com/seiyria/bootstrap-slider
	const bpmSlider = $('#BPMSlider').bootstrapSlider({
		min: app.bpmMin,
		max: app.bpmMax,
		value: app.bpm,
		step: 1,
	});
	bpmSlider.change(() => app.bpm = Tone.Transport.bpm.value = bpmSlider.bootstrapSlider('getValue'));

	//https://tonejs.github.io/docs/

	// ==== BPM ====

	// :: Meter ::

	// const beatsInput = $('#BeatsInput');
	// const subunitsInput = $('#SubunitsInput');

	// beatsInput.change(() => setMeter(parseInt(beatsInput.val()), parseInt(subunitsInput.val())));
	// subunitsInput.change(() => setMeter(parseInt(beatsInput.val()), parseInt(subunitsInput.val())));

	// :: Subdivisions ::

	// const Subdivisions = {
	// 	None: 'None',
	// 	Single: 'Single',
	// 	Duple: 'Duple',
	// 	Triple: 'Triple',
	// 	Quadruple: 'Quadruple',
	// 	Quintuple: 'Quintuple',
	// 	Sextuple: 'Sextuple',
	// 	Septuple: 'Septuple',
	// 	Tripple3rd: 'Tripple 3rd',
	// 	Quadruple4th: 'Quadruple 4th',
	// };
	// const subdivisionsInput = $('#SubdivisionsInput');

	// subdivisionsInput.click(() => setSubdivisions(parseInt(subdivisionsInput.val())));

	// :: Pills ::

	const pills = $('#Pills');

	// :: Sounds ::

	/*
	The top number of the time signature tells you how many beats to count. This could be any number. 
	Most often the number of beats will fall between 2 and 12.

	The bottom number tells you what kind of note to count. That is, whether to count the beats as quarter notes, eighth notes, 
	or sixteenth notes. So the only numbers you will see as the bottom number (the denominator) will correspond to note values:

		1 = whole note (you’ll never see this)
		2 = half note
		4 = quarter note
		8 = eighth note
		16 = sixteenth note 
	*/

	//The time signature as just the numerator over 4. For example 4/4 would be just 4 and 6/8 would be 3.
	//Tone.Transport.timeSignature = getMeter();
	//Tone.Transport.bpm.value = app.bpm; //getBPM();

	//console.log('timeSignature', Tone.Transport.timeSignature);
	// console.log('value', Tone.Transport.bpm.value);

	const accent = new Tone.Player({
		url: "./Sounds/Ping Hi.wav",
	}).toMaster();
	const beat = new Tone.Player({
		url: "./Sounds/Ping Low.wav",
	}).toMaster();

	function loop(time) {

		currentNote = (currentNote % Tone.Transport.timeSignature) + 1;
		//console.log('currentNote', currentNote);
		const currentPill = $(pills.children()[currentNote - 1]);
		//console.log('currentPill', currentPill.css('background-color'));

		if (currentNote === 1) {
			currentPill.animate({
				backgroundColor: "rgb(255,0,0)"
			}, 50, () => currentPill.animate({
				backgroundColor: '#636c72'
			}));
			accent.start(time);
		} else {
			currentPill.animate({
				backgroundColor: "rgb(0,255,0)"
			}, 50, () => currentPill.animate({
				backgroundColor: '#636c72'
			}));
			beat.start(time);
		}

		if (app.bpmRamp.stepsEnabled && currentNote === Tone.Transport.timeSignature) {
			const increase = (app.bpmRamp.to - app.bpmRamp.from) / app.bpmRamp.interval;
			const bpm = Math.round(Math.max(Math.min(Tone.Transport.bpm.value + increase, app.bpmRamp.to), app.bpmRamp.from));
			Tone.Transport.bpm.setValueAtTime(bpm, time);
		}
		app.bpm = Math.round(Tone.Transport.bpm.value);
		bpmSlider.bootstrapSlider('setValue', app.bpm);
	}

	// :: Functions ::

	// function getMeter() {

	// 	const beats = parseInt(beatsInput.val());
	// 	const subunits = parseInt(subunitsInput.val());
	// 	return [beats, subunits];
	// }

	// function setMeter(beats, subunits) {

	// 	beatsInput.val(beats);
	// 	subunitsInput.val(subunits);
	// 	Tone.Transport.timeSignature = [beats, subunits];

	// 	pills.empty();
	// 	for (var index = 1; index <= Tone.Transport.timeSignature; index++) {
	// 		pills.append($('<span>').addClass('badge badge-pill badge-default').css('margin', '3px').text(index));
	// 		//pills.append(`<span class="badge badge-pill badge-default">${index}</span>`);				
	// 	}
	// }

	// function getSubdivisions() {

	// 	return _(Subdivisions).findKey(value => value === subdivisionsInput.val());
	// }

	// function setSubdivisions(subdivisions) {

	// 	subdivisionsInput.val(Subdivisions[subdivisions]);
	// }
});