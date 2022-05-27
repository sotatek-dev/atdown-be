'use strict'

const moment = require('moment')

const convertUnixTimeToDateTime = (time) => {
  // return moment.unix(time).format("DD/MM/yyyy hh:mm:ss a");
  return moment.unix(time).format("hh:mm:ss A MM/DD/yyyy");
}

const getDatetimeNowUTC = () => {
  return moment(moment.utc(Date.now())).unix();
}

const convertDateTimeToUnix = (time) => {
  if (!time) return "";
  const unixTime = moment(time).format("x");
  return moment(time).format('x').substring(0, unixTime.length - 3);
}

const buildMomentTimezone = (datetime) => {
  if (!datetime) return '';

  // const momentTimezoneObject = moment(datetime).local();
  const momentTimezoneObject = moment(moment.utc(datetime)).local();
  return momentTimezoneObject;
}

const convertDateLocalWithTimezone = (datetime) => {
  if (!datetime) return '';
  const date = buildMomentTimezone(datetime).format("hh:mm:ss A");
  return date;
}

const convertTimeLocalWithTimezone = (datetime) => {
  if (!datetime) return '';
  const time = buildMomentTimezone(datetime).format("MM/DD/YYYY");
  return time;
}

const unixTimeNow = () => {
  return parseInt((Date.now() / 1000) + '')
}

const unixTime = (time) => {
  return moment(time).unix();
}

module.exports = {
  convertUnixTimeToDateTime,
  getDatetimeNowUTC,
  convertDateTimeToUnix,
  buildMomentTimezone,
  convertDateLocalWithTimezone,
  convertTimeLocalWithTimezone,
  unixTime,
  unixTimeNow
}
