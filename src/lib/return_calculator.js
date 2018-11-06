const moment = require('moment');
const R = require('ramda');

const MONTHS_IN_YEAR = 12;

const getDataForDates = ({ stockData, periodStartDate, periodCadenceInMonths }) => {
  const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;

  const periodStartDateMoment = moment(periodStartDate);
  let currentPeriodEndDate = periodStartDateMoment;
  const dataForPeriodEndDates = R.reduce(
    (accum, dataForDay) => {
      if (moment(dataForDay.date) >= currentPeriodEndDate && accum.length < numberOfPeriods + 1) {
        accum.push(R.merge({ esppPeriodDate: currentPeriodEndDate.format('YYYY-MM-DD') }, dataForDay));
        currentPeriodEndDate = currentPeriodEndDate.add(periodCadenceInMonths, 'months');
      }
      return accum;
    },
    [],
    stockData
  );

  return R.zip(R.init(dataForPeriodEndDates), R.tail(dataForPeriodEndDates));
};

const SHARE_PERCENTAGE = 0.5;
const ESPP_MAX_CONTRIB_PER_YEAR = 25000;

const calculateESPPEarnings = ({
  stockData,
  periodStartDate,
  income,
  lookback,
  periodCadenceInMonths,
  discount,
  contributionPercentage,
}) => {
  const numberOfPeriods = MONTHS_IN_YEAR / periodCadenceInMonths;
  const contributionPerPeriod = (contributionPercentage * income) / numberOfPeriods;
  let totalIRSContributions = 0;

  const earnings = R.map(([ periodStart, periodEnd ]) => {
    const priceOfStock = periodEnd.close;
    const buyPriceOfStock = lookback ? Math.min(periodStart.close, periodEnd.close) : periodEnd.close;

    const maxStocksPurchasableWithIRSLimitThisPeriod = Math.floor(
      (ESPP_MAX_CONTRIB_PER_YEAR - totalIRSContributions) / periodStart.close
    );

    const contributionThisPeriod = contributionPerPeriod;

    const discountedPurchasePrice = (1 - discount) * buyPriceOfStock;
    const stockBought = Math.min(
      Math.floor(contributionThisPeriod / discountedPurchasePrice), // stocks we can buy normally
      maxStocksPurchasableWithIRSLimitThisPeriod
    );
    const moneyUsedToBuyStock = stockBought * discountedPurchasePrice;
    const unusedMoney = contributionThisPeriod - moneyUsedToBuyStock;
    const totalSalePrice = stockBought * priceOfStock;
    const gain = totalSalePrice - moneyUsedToBuyStock;
    const amountToPayBack = contributionThisPeriod + SHARE_PERCENTAGE * gain;
    const cashInBankAfterSale = totalSalePrice + unusedMoney;
    const moneyMadeByClient = cashInBankAfterSale - amountToPayBack;
    const moneyMadeByCake = amountToPayBack - contributionThisPeriod;

    totalIRSContributions += stockBought * periodStart.close;

    return {
      amountToPayBack,
      buyPriceOfStock,
      cashInBankAfterSale,
      contributionThisPeriod,
      discountedPurchasePrice,
      gain,
      maxStocksPurchasableWithIRSLimitThisPeriod,
      moneyUsedToBuyStock,
      moneyMadeByCake,
      moneyMadeByClient,
      periodEnd,
      periodStart,
      priceOfStock,
      stockBought,
      totalSalePrice,
      totalIRSContributions,
      unusedMoney,
    };
  }, getDataForDates({ stockData, periodStartDate, periodCadenceInMonths }));

  return earnings;
};

module.exports = {
  calculateESPPEarnings,
  getDataForDates,
};
