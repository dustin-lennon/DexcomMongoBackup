import * as moment from 'moment';

const dateFormatRegex = /\d{4}-\d{2}-\d{2}/;

export function validateDateFormat(date: string) {
	return dateFormatRegex.test(date) ? date : null;
}

export function validateDate(date: string) {
	return moment(date).isValid();
}
