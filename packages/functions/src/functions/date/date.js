const { locale } = require('@cedalo/machine-core');
const {
	date: { ms2serial, serial2date, time2serial },
	sheet: { getLocale },
	runFunction,
	values: { roundNumber }
} = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const SEC_MS = 1000;
const MIN_MS = 60 * SEC_MS;
const HOUR_MS = 60 * MIN_MS;
const timeregex = new RegExp(/(\d\d?):(\d\d?):?(\d?\d?)\s*(am|pm)?/, 'i');
const isoregex = /^[+-]?(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;

const validateISOFormat = str => str && isoregex.test(str) ? str : Error.code.VALUE;

const timeToSerial = (hours = 0, minutes = 0, seconds = 0) => {
	const ms = (hours * HOUR_MS) + (minutes * MIN_MS) + (seconds * SEC_MS);
	return roundNumber(time2serial(ms), 8);
};
const parseTimeStr = (str) => {
	const timearr = timeregex.exec(str);
	if (timearr) {
		let hours = Number(timearr[1]);
		const minutes = Number(timearr[2]);
		const seconds = Number(timearr[3]);
		const pm = timearr[4];
		if (pm != null && pm.toLowerCase() === 'pm') {
			hours += 12;
		}
		return timeToSerial(hours, minutes, seconds);
	}
	return Error.code.VALUE;
};

// DL-784: check against german-like date format, e.g. 01.08.2018... more may supported...
// const convertDateFormat = (str) => {
// 	const parts = str.split('.');
// 	return parts.length > 2 ? `${parts[1]}/${parts[0]}/${parts[2]}` : str;
// };

const date = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg(year => convert.toNumber(year.value, Error.code.VALUE))
		.mapNextArg(month => convert.toNumber(month.value, Error.code.VALUE))
		.mapNextArg(day => convert.toNumber(day.value, Error.code.VALUE))
		.run((year, month, day) => Math.round(ms2serial(Date.parse(`${year}-${month}-${day}`))));

const datevalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(datestr => convert.toString(datestr.value, Error.code.VALUE))
		.run((datestr) => {
			const localizer = locale.use({ locale: getLocale(sheet) });
			return Math.round(ms2serial(localizer.parse(datestr)));
		});

const time = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg(hours => convert.toNumber(hours.value, Error.code.VALUE))
		.mapNextArg(minutes => convert.toNumber(minutes.value, Error.code.VALUE))
		.mapNextArg(seconds => convert.toNumber(seconds.value, Error.code.VALUE))
		.run((hours, minutes, seconds) => timeToSerial(hours, minutes, seconds));

const timevalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(timestr => convert.toString(timestr.value) || Error.code.VALUE)
		.run(timestr => parseTimeStr(timestr));

const jsontime2excel = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((str) => validateISOFormat(convert.toString(str.value)))
		.run((str) => {
			const ms = Date.parse(str);
			return !Number.isNaN(ms) ? ms2serial(ms) : Error.code.VALUE;
		});

const excel2jsontime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((serial) => convert.toNumber(serial.value, Error.code.VALUE))
		.run((serial) => serial2date(serial).toJSON());

// REPLACE PARSER FUNCTION, it seems to have not a millisecond resolution:
const millisecond = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((serial) => convert.toNumber(serial.value, Error.code.VALUE))
		.run((serial) => serial2date(serial).getMilliseconds()); // getUTCMilliseconds());

module.exports = {
	DATE: date,
	DATEVALUE: datevalue,
	EXCEL2JSONTIME: excel2jsontime,
	JSONTIME2EXCEL: jsontime2excel,
	MILLISECOND: millisecond,
	TIME: time,
	TIMEVALUE: timevalue
};
