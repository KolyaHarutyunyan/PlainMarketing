const moment = require('moment');
const R = require('ramda');

const MONTHS_IN_YEAR = 12;

const getDataForDates = ({ stockData, periodStartDate, periodCadenceInMonths }) => {
    const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;

    const periodStartDateMoment = moment(periodStartDate);
    let currentPeriodEndDate = periodStartDateMoment;
    const dataForPeriodEndDates = R.reduce(
        (accum, dataForDay) => {
            if (
                moment(dataForDay.date) >= currentPeriodEndDate &&
                accum.length < numberOfPeriods + 1
            ) {
                accum.push(R.merge(
                    { esppPeriodDate: currentPeriodEndDate.format('YYYY-MM-DD') },
                    dataForDay
                ));
                currentPeriodEndDate = currentPeriodEndDate.add(periodCadenceInMonths, 'months');
            }
            return accum;
        },
        [],
        stockData
    );

    return R.zip(
        R.init(dataForPeriodEndDates),
        R.tail(dataForPeriodEndDates),
    );
};

const SHARE_PERCENTAGE = 0.5;

const calculateESPPEarnings = ({
    stockData,
    periodStartDate,
    income,
    lookback,
    periodCadenceInMonths,
    discount,
    contributionPercentage
}) => {
    const contributionPerPeriod = contributionPercentage * income / (MONTHS_IN_YEAR / periodCadenceInMonths);
    const earnings = R.map(
        ([ periodStart, periodEnd ]) => {
            const priceOfStock = periodEnd.open;
            const buyPriceOfStock = lookback ? Math.min(periodStart.open, periodEnd.open) : periodEnd.open;

            const stockBought = contributionPerPeriod / ((1 - discount) * buyPriceOfStock);
            const totalSalePrice = stockBought * priceOfStock;
            const gain = totalSalePrice - contributionPerPeriod;
            return {
                contributionPerPeriod,
                priceOfStock,
                buyPriceOfStock,
                stockBought,
                totalSalePrice,
                gain,
                periodStart,
                periodEnd
            };
        },
        getDataForDates({ stockData, periodStartDate, periodCadenceInMonths })
    );

    return earnings;
};

module.exports = {
    calculateESPPEarnings,
    getDataForDates,
};