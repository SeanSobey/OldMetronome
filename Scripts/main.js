//https://tonejs.github.io/docs/

// :: Time ::

const timer = new Timer();
const timeLabel = $('#TimeLabel');

// :: Controls ::

const playPauseButton = $('#PlayPauseButton');
const stopButton = $('#StopButton');
const volumeUpButton = $('#VolumeUpButton');
const volumeDownButton = $('#VolumeDownButton');
const volumeOffButton = $('#VolumeOffButton');
const volumeSpan = $('#VolumeSpan');
let playing = false;

playPauseButton.click(() => {

	if (playing) {
		pause();
	} else {
		play();
	}
	playing = !playing;
});
stopButton.click(() => {

	stop();
	playing = false;
});
volumeUpButton.click(() => {

	volumeSpan.show();
	Tone.Master.mute = false;

	const clampedVolume = parseInt(Math.min(Tone.Master.volume.value + 3, 24));
	volumeSpan.text(clampedVolume >= 0 ? '+' + clampedVolume : clampedVolume);
	Tone.Master.volume.value = clampedVolume;
});
volumeDownButton.click(() => {

	volumeSpan.show();
	Tone.Master.mute = false;

	const clampedVolume = parseInt(Math.max(Tone.Master.volume.value - 3, -24));
	volumeSpan.text(clampedVolume >= 0 ? '+' + clampedVolume : clampedVolume);
	Tone.Master.volume.value = clampedVolume;
});
volumeOffButton.click(() => {

	Tone.Master.mute ? volumeSpan.show() : volumeSpan.hide(); // Invert cuz we gonna change it now
	Tone.Master.mute = !Tone.Master.mute;
});

// ==== BPM ====

// :: BPM Input ::

const bpmInput = $('#BPMInput');
const bpmIncreaseButton = $('#BPMIncreaseButton');
const bpmDecreaseButton = $('#BPMDecreaseButton');
const bpmTapButton = $('#BPMTapButton');
let taps = [];
const tapTimeout = 1000 * 4;

bpmInput.change(() => setBPM(parseInt(bpmInput.val())));
bpmIncreaseButton.click(() => setBPM(parseInt(bpmInput.val()) + 10));
bpmDecreaseButton.click(() => setBPM(parseInt(bpmInput.val()) - 10));
bpmTapButton.click(() => {

	const now = new Date().getTime();
	if (taps.length > 0 && (now - taps[taps.length - 1]) > tapTimeout) {
		taps = [];
		setBPM(parseInt(100));
	}
	taps.push(now);
	if (taps.length === 1) {
		return;
	}
	const tapsDifference = [];
	for (let index = 1; index < taps.length; index++) {
		tapsDifference.push(taps[index] - taps[index - 1]);
	}
	const avg = (tapsDifference.reduce((a, b) => a + b) / tapsDifference.length);
	const bpm = (1000 * 60) / avg;
	setBPM(parseInt(bpm));
});

// :: BPM Slider ::

//https://github.com/seiyria/bootstrap-slider

const bpmSlider = $('#BPMSlider').bootstrapSlider({
	min: parseInt(bpmInput.attr('min')),
	max: parseInt(bpmInput.attr('max')),
	value: getBPM(),
	step: 1,
});
bpmSlider.change(() => setBPM(bpmSlider.bootstrapSlider('getValue')));

// :: BPM Ramp ::

const bpmRampFromInput = $('#BPMRampFromInput');
const bpmRampToInput = $('#BPMRampToInput');
const bpmRampTimeInput = $('#BPMRampTimeInput');
const bpmRampEnabledInput = $('#BPMRampEnabledInput');

bpmRampFromInput.change(() => {

	Tone.Transport.bpm.value = parseInt(bpmRampFromInput.val());
	Tone.Transport.bpm.rampTo(parseInt(bpmRampToInput.val()), parseInt(bpmRampTimeInput.val()));
});
bpmRampToInput.change(() => {

	Tone.Transport.bpm.value = parseInt(bpmRampFromInput.val());
	Tone.Transport.bpm.rampTo(parseInt(bpmRampToInput.val()), parseInt(bpmRampTimeInput.val()));
});
bpmRampTimeInput.change(() => {

	Tone.Transport.bpm.value = parseInt(bpmRampFromInput.val());
	Tone.Transport.bpm.rampTo(parseInt(bpmRampToInput.val()), parseInt(bpmRampTimeInput.val()));
});
bpmRampEnabledInput.change(() => {

	const bpmRampEnabled = bpmRampEnabledInput.is(':checked');

	bpmInput.prop('disabled', bpmRampEnabled);
	bpmIncreaseButton.prop('disabled', bpmRampEnabled);
	bpmDecreaseButton.prop('disabled', bpmRampEnabled);
	bpmTapButton.prop('disabled', bpmRampEnabled);
	bpmRampEnabled ? bpmSlider.bootstrapSlider('disable') : bpmSlider.bootstrapSlider('enable');

	bpmRampFromInput.prop('disabled', !bpmRampEnabled);
	bpmRampToInput.prop('disabled', !bpmRampEnabled);
	bpmRampTimeInput.prop('disabled', !bpmRampEnabled);
});

// Otherwise may persist over refresh!
bpmRampEnabledInput.prop("checked", false);
bpmRampFromInput.prop('disabled', true);
bpmRampToInput.prop('disabled', true);
bpmRampTimeInput.prop('disabled', true);

// :: Meter ::

const beatsInput = $('#BeatsInput');
const subunitsInput = $('#SubunitsInput');

beatsInput.change(() => setMeter(parseInt(beatsInput.val()), parseInt(subunitsInput.val())));
subunitsInput.change(() => setMeter(parseInt(beatsInput.val()), parseInt(subunitsInput.val())));

// :: Subdivisions ::

const Subdivisions = {
	None: 'None',
	Single: 'Single',
	Duple: 'Duple',
	Triple: 'Triple',
	Quadruple: 'Quadruple',
	Quintuple: 'Quintuple',
	Sextuple: 'Sextuple',
	Septuple: 'Septuple',
	Tripple3rd: 'Tripple 3rd',
	Quadruple4th: 'Quadruple 4th',
};
const subdivisionsInput = $('#SubdivisionsInput');

subdivisionsInput.click(() => setSubdivisions(parseInt(subdivisionsInput.val())));

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
Tone.Transport.timeSignature = getMeter();
Tone.Transport.bpm.value = getBPM();

//console.log('timeSignature', Tone.Transport.timeSignature);
// console.log('value', Tone.Transport.bpm.value);

const accent = new Tone.Player({
	url: "./Sounds/Ping Hi.wav",
}).toMaster();
const beat = new Tone.Player({
	url: "./Sounds/Ping Low.wav",
}).toMaster();

let currentNote = 0;

//https://tonejs.github.io/docs/#types/Time
Tone.Transport.scheduleRepeat((time) => {

	currentNote = (currentNote % Tone.Transport.timeSignature) + 1;
	console.log('currentNote', currentNote);
	const currentPill = $(pills.children()[currentNote - 1]);
	console.log('currentPill', currentPill.css('background-color'));

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

	bpmSlider.bootstrapSlider('setValue', parseInt(Tone.Transport.bpm.value));
	bpmInput.val(parseInt(Tone.Transport.bpm.value));
}, "4n");

// TODO: Reset ALL ui

// :: Functions ::

function play() {

	// if (bpmRampEnabledInput.is(':checked')) {
	// 	setBPM(parseInt(bpmRampFromInput.val()));
	// }

	if (bpmRampEnabledInput.is(':checked')) {

		setBPM(parseInt(bpmRampFromInput.val()));
		Tone.Transport.bpm.value = parseInt(bpmRampFromInput.val());
		Tone.Transport.bpm.rampTo(parseInt(bpmRampToInput.val()), parseInt(bpmRampTimeInput.val()));
	} else {

		Tone.Transport.bpm.value = getBPM();
		Tone.Transport.bpm.rampTo(Tone.Transport.bpm.value, 0);
	}

	playPauseButton.html('<i class="fa fa-pause"></i>');
	Tone.Transport.start();
	timer.start((h, m, s, ms) => timeLabel.text(h + ':' + ("0" + m).slice(-2) + ':' + ("0" + s).slice(-2)));
}

function pause() {

	playPauseButton.html('<i class="fa fa-play"></i>');
	Tone.Transport.pause();
	timer.pause();
}

function stop() {

	playPauseButton.html('<i class="fa fa-play"></i>');
	Tone.Transport.stop();
	timer.stop();
	timeLabel.text('0:00:00');
}

function getBPM() {

	return parseInt(bpmInput.val());
}

function setBPM(value) {

	const clampedValue = Math.max(Math.min(value, bpmInput.attr('max')), bpmInput.attr('min'));
	bpmSlider.bootstrapSlider('setValue', clampedValue);
	bpmInput.val(clampedValue);
	Tone.Transport.bpm.value = clampedValue;
}

function getMeter() {

	const beats = parseInt(beatsInput.val());
	const subunits = parseInt(subunitsInput.val());
	return [beats, subunits];
}

function setMeter(beats, subunits) {

	beatsInput.val(beats);
	subunitsInput.val(subunits);
	Tone.Transport.timeSignature = [beats, subunits];

	pills.empty();
	for (var index = 1; index <= Tone.Transport.timeSignature; index++) {
		pills.append($('<span>').addClass('badge badge-pill badge-default').css('margin', '3px').text(index));
		//pills.append(`<span class="badge badge-pill badge-default">${index}</span>`);				
	}
}

function getSubdivisions() {

	return _(Subdivisions).findKey(value => value === subdivisionsInput.val());
}

function setSubdivisions(subdivisions) {

	subdivisionsInput.val(Subdivisions[subdivisions]);
}