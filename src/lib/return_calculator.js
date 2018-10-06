const moment = require('moment');
const R = require('ramda');

const MONTHS_IN_YEAR = 12;

const getDataForDates = ({ stockData, periodStartDate, periodCadenceInMonths }) => {
    const periodStartDateMoment = moment(periodStartDate);
    const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;

    let currentPeriodEndDate = periodStartDateMoment.add(periodCadenceInMonths, 'months');
    const dataForPeriodEndDates = R.reduce(
        (accum, dataForDay) => {
            if (
                moment(dataForDay.date) >= currentPeriodEndDate &&
                R.keys(accum).length < numberOfPeriods
            ) {
                accum.push(R.merge(
                    { esppPeriodEndDate: currentPeriodEndDate.format('YYYY-MM-DD') },
                    dataForDay
                ));
                currentPeriodEndDate = periodStartDateMoment.add(periodCadenceInMonths, 'months');
            }
            return accum;
        },
        [],
        stockData
    );

    return dataForPeriodEndDates;
};

module.exports = {
    getDataForDates
};