class Timer {
	constructor() {
		this.startTime = null;
		this.timer = null;
		this.interval = 250; // adjust this number to affect granularity, lower numbers are more accurate, but more CPU-expensive
	}
	start(callback) {
		if (!this.startTime) {
			this.startTime = new Date().getTime();
		}
		this.timer = setInterval(() => {
			const now = new Date().getTime();
			const distance = now - this.startTime;
			const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			const s = Math.floor((distance % (1000 * 60)) / 1000);
			const ms = Math.floor((distance % 1000));
			callback(h, m, s, ms);

		}, this.interval);
	}
	pause() {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}
	stop() {
		if (this.timer) {
			clearInterval(this.timer);
		}
		this.startTime = null;
	}
}