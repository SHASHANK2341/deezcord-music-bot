export class DeezCordTimeUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    /**
     * Await a Promise for the given time in milliseconds
     * @param {number} time in ms, default = 10 ms (Less could cause bugs in timeouts and promises etc.)
     * @returns {Promise<2>} Promise of the given time 
     */
    delay(time = 10) {
        return new Promise((r, _) => setTimeout(() =>r(2), time))
    }
    /**
     * Format duration to second
     * @param {number} duration in ms 
     * @returns {string} Formatted Time in Seconds
     */
    onlySecondDuration(duration) {
        const time = Math.floor(duration / 1000 * 100) / 100;
        return `${time} Sec${time !== 1 ? "s" : ""}`
    }
    /**
     * Format a Second/Minute/Hour Timespan to double Digits
     * @param {number} n if not provied "00" will be returned 
     * @returns {string} Returns string of number less then 10 formatted to 2 letters long
     */
    set2string (n) {
        if(!n) return "00"; // Returning so it doesn't crash

        return (n < 10 ? '0' : '') + n;
    }

    /**
     * Format a Millisecond Timespan to triple Digits
     * @param {number} n if not provied "000" will be returned 
     * @returns {string} formatted Millisconds in a length of 3
     */
    formatMS(n) {
        if(!n) return "000"; // Returning so it doesn't crash
        return n + (Number(n) < 10 ? '00' : Number(n) < 100 ? '0' : ''); 
    }

    /**
     * Get the current Process-Time formatted
     * @param {number} timestamp Time in ms
     * @returns {string} Time Formatted as: "ddd DD-MM-YYYY HH:mm:ss.SSSS"
     */
    getDateTimeString(timestamp = Date.now()) {
        const date = new Date(timestamp);
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const DD = this.set2string(date.getDate()); //The Day
        const MM = this.set2string(date.getMonth() + 1); //The Month
        const YYYY = date.getFullYear(); //The Year
        const HH = this.set2string(date.getHours()); //Hours
        const mm = this.set2string(date.getMinutes()); //Minutes
        const ss = this.set2string(date.getSeconds()); //Seconds
        const SSSS = this.formatMS(date.getMilliseconds()); //Milliseconds
        const ddd = days[ date.getDay() ]; //get the day of the week
        //ddd DD-MM-YYYY HH:mm:ss.SSSS
        return `${ddd} ${DD}-${MM}-${YYYY} ${HH}:${mm}:${ss}.${SSSS}`
    }


    /**
     * Parse Time in Seconds with util Functions
     */
    Second = {
        /** @param {number} time */
        Minute: (time = 1) => time * 60,
        /** @param {number} time */
        Hour: (time = 1) => time * 60 * 60,
        /** @param {number} time */
        Day: (time = 1) => time * 60 * 60 * 24,
        /** @param {number} time */
        Week: (time = 1) => time * 60 * 60 * 24 * 7,
    }

    /**
     * Parse Time in Millisecond with util Functions
     */
    Millisecond = {
        /** @param {number} time */
        Second: (time = 1) => time * 1000,
        /** @param {number} time */
        Minute: (time = 1) => time * 1000 * 60,
        /** @param {number} time */
        Hour: (time = 1) => time * 1000 * 60 * 60,
        /** @param {number} time */
        Day: (time = 1) => time * 1000 * 60 * 60 * 24,
        /** @param {number} time */
        Week: (time = 1) => time * 1000 * 60 * 60 * 24 * 7,
    }

    /**
     * Format a second-duration to [ 'X Days', 'X Hours', 'X Mins', 'X Secs' ]
     * Format a millisecond-duration to [ 'X Days', 'X Hours', 'X Mins', 'X Secs', 'X ms' ]
     * @param {number} value time in Sconds/ms
     * @param {boolean} inputAsMs if the value is in milliseconds
     * @returns {string} formatted duration time
     */
    formatDuration(value, inputAsMs) {
        let times = [86400, 3600, 60, 1];
        if(inputAsMs) times = [...times.map(x => x * 1000), 1] 
        return times.reduce((acc, cur) => {
            const res = ~~(value / cur);
            value -= res * cur;
            return [...acc, res];
        }, []).map((x, i) => {
            if(!x) return undefined; 
            const text = ["Day", "Hr", "Min", "Sec", "ms"][i];
            return `${x} ${text}${i <= 3 && x !== 1 ? "s" : ""}`
        }).filter(Boolean);
    }

    /**
     * Format a second-duration to HH:MM:SS
     * @param {number} value
     * @param {boolean} inputAsMs if the value is in milliseconds
     * @returns {string} formatted duration
     */
    durationFormatted(value, inputAsMs) {
        let times = [86400, 3600, 60, 1];
        if(inputAsMs) times = [...times.map(x => x * 1000), 1] 
        return times.reduce((acc, cur) => {
            let res = ~~(value / cur);
            value -= res * cur;
            return [...acc, res];
        }, []).filter(Boolean).map(v => `${v < 10 ? `0${v}` : v}`).join(":");
    }
}