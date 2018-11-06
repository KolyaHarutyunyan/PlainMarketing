import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import { Button, Card, Col, Icon, Row, Spin } from 'antd';
import axios from 'axios';
import moment from 'moment';

import { ESPPCalculatorTooltip } from './espp_calculator_helper_components';
import config from '../config';
import * as returnCalculator from '../lib/return_calculator';
import { formatDollars } from '../lib/helpers';

import './espp_profits_display.css';
import lastYearLineImageSrc from './../public/calculator/last-year-profits-line.png';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES },
} = config;

const get5YDataUrl = companyTicker => `https://api.iextrading.com/1.0/stock/${companyTicker}/chart/5y`;

export const ESPPProfitsDisplay = stateManagerContainer.withStateManagers({
  stateManagerNames: [
    STATE_MANAGER_NAMES.COMPANY_INFO,
    STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS,
    STATE_MANAGER_NAMES.STOCK_DATA,
  ],
  WrappedComponent: class ESPPProfitsDisplay extends Component {
    constructor(props) {
      super(props);

      this.companyInfo = this.props.stateManagers[STATE_MANAGER_NAMES.COMPANY_INFO];
      this.esppProfitsModelInputsStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS];
      this.stockDataStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.STOCK_DATA];
    }

    async componentDidMount() {
      this.stockDataStateManager.asyncUpdate(async () => {
        const esppProfitsModel = this.esppProfitsModelInputsStateManager.getData();

        const fiveYearStockData = (await axios.get(get5YDataUrl(esppProfitsModel.company))).data;

        const args = R.merge(
          { stockData: fiveYearStockData },
          R.pick(
            [ 'periodStartDate', 'periodCadenceInMonths', 'income', 'lookback', 'discount', 'contributionPercentage' ],
            esppProfitsModel
          )
        );

        const returnInfo = returnCalculator.calculateESPPEarnings(args);

        return { fiveYearStockData, returnInfo };
      });
    }

    renderReturnInfoSummaryArea() {
      const loadingStockData = this.stockDataStateManager.isLoading();
      const returnInfo = R.propOr([], 'returnInfo', this.stockDataStateManager.getData());

      const dollarsEarnedLastYear = R.sum(R.pluck('moneyMadeByClient', returnInfo));

      const DOLLARS_PER_FLIGHT = 270;
      const DOLLARS_PER_CUP_OF_JOE = 2.1;
      const roundTripFlights = Math.floor(dollarsEarnedLastYear / DOLLARS_PER_FLIGHT);
      const dollarsLeftForJoe = dollarsEarnedLastYear - roundTripFlights * DOLLARS_PER_FLIGHT;
      const cupsOfJoe = Math.max(4, Math.ceil(dollarsLeftForJoe / DOLLARS_PER_CUP_OF_JOE));

      const { company } = this.esppProfitsModelInputsStateManager.getData();
      const { symbolToNameMap } = this.companyInfo.getData() || { symbolToNameMap: {} };
      const companyName = symbolToNameMap[company];

      console.log(returnInfo);

      return (
        <Row className='return-info-summary-container'>
          <Col sm={3}>
            <Button
              type='danger'
              className='go-back-button'
              onClick={() => {
                this.stockDataStateManager.clearData();
                this.props.goBack();
              }}
            >
              <Icon type='left' />
              Go Back
            </Button>
          </Col>
          <Col sm={18}>
            {loadingStockData ? (
              <Card loading={true} style={{ maxWidth: '50%', margin: '0 auto' }}>
                {' '}
              </Card>
            ) : (
              <Fragment>
                <Row type='flex' justify='center' align='middle'>
                  <div className='last-year-container'>
                    <p>Last year you would have made:</p>
                    <p className='earnings'>
                      {formatDollars({ value: dollarsEarnedLastYear })}
                      <br />
                      <img alt={''} src={lastYearLineImageSrc} style={{ width: '180px' }} />
                    </p>
                    <p>
                      via your {companyName} ESPP by using <strong>Cake Financials</strong>
                    </p>
                  </div>
                </Row>
                <Row>
                  <div className='flights-and-coffee-container'>
                    <p>
                      That is enough to buy {roundTripFlights} round-trip flights from Dallas, TX to Reykjavik, Iceland
                      and {cupsOfJoe} cups of coffee to enjoy as you plan those well-deserved vacations.
                    </p>
                  </div>
                </Row>
              </Fragment>
            )}
          </Col>
        </Row>
      );
    }

    getCardTooltipText(currentPeriodReturnInfo) {
      const {
        contributionThisPeriod,
        stockBought,
        priceOfStock,
        buyPriceOfStock,
        discountedPurchasePrice,
      } = currentPeriodReturnInfo;

      return (
        <Fragment>
          <span>Cash withheld: {formatDollars({ value: contributionThisPeriod, space: false })}</span>
          <br />
          <span>Stock Purchase Price: {formatDollars({ value: buyPriceOfStock, space: false })}</span>
          <br />
          <span>Discounted Price: {formatDollars({ value: discountedPurchasePrice, space: false })}</span>
          <br />
          <span>Shares purchased: {stockBought}</span>
          <br />
          <span>
            Profit Per Share: {formatDollars({ value: priceOfStock - discountedPurchasePrice, space: false })}
          </span>
          <br />
          <span>
            Total Profit:{' '}
            {formatDollars({ value: stockBought * (priceOfStock - discountedPurchasePrice), space: false })}
          </span>
          <br />
          <span>
            Your Share:{' '}
            {formatDollars({ value: 0.5 * stockBought * (priceOfStock - discountedPurchasePrice), space: false })}
          </span>
          <br />
        </Fragment>
      );
    }

    render() {
      const loadingStockData = this.stockDataStateManager.isLoading();

      const returnInfo = R.propOr(null, 'returnInfo', this.stockDataStateManager.getData());

      const { periodCadenceInMonths } = this.esppProfitsModelInputsStateManager.getData();
      const numberOfCards = 12 / periodCadenceInMonths;

      const NUMBER_OF_CARDS_TO_LABEL_MAP = {
        12: idx => `M${idx + 1}`,
        4: idx => `Q${idx + 1}`,
        2: idx => `Q${2 * (idx + 1) - 1}/Q${2 * (idx + 1)}`,
        1: idx => `Year ${idx + 1}`,
      };

      return (
        <div className='espp-profits-display-container'>
          <Spin spinning={loadingStockData}>
            {this.renderReturnInfoSummaryArea()}
            <Row className='period-returns-summary-container'>
              <Col className='summary-card-container-column' sm={{ span: 20, offset: 2 }} lg={{ span: 16, offset: 4 }}>
                {R.addIndex(R.map)(
                  (groupOfCols, key) => (
                    <Row key={key} gutter={32}>
                      {groupOfCols}
                    </Row>
                  ),
                  R.splitEvery(
                    2,
                    R.map(cardIdx => {
                      const currentPeriodReturnInfo = returnInfo && returnInfo[cardIdx];

                      const description = !R.isNil(returnInfo) ? (
                        <Fragment>
                          <div className='card-tooltip-container'>
                            <ESPPCalculatorTooltip tooltipText={this.getCardTooltipText(currentPeriodReturnInfo)} />
                          </div>
                          <Row type='flex' justify='center' align='middle'>
                            <Col>
                              <p className='period-label'>
                                Your {NUMBER_OF_CARDS_TO_LABEL_MAP[numberOfCards](cardIdx)} Earnings
                              </p>
                            </Col>
                          </Row>
                          <Row type='flex' justify='center' align='middle'>
                            <p className='period-gain-in-dollars'>
                              + {formatDollars({ value: currentPeriodReturnInfo.moneyMadeByClient, space: false })}
                            </p>
                          </Row>
                          <Row gutter={12}>
                            <Col span={12}>
                              <p className='period-timespan'>
                                {moment(currentPeriodReturnInfo.periodStart.date).format('MM-DD-YYYY')}
                              </p>
                              <p className='stock-start-end'>
                                {'Stock Start: '}
                                {formatDollars({ value: currentPeriodReturnInfo.periodStart.close, space: false })}
                              </p>
                            </Col>
                            <Col span={12}>
                              <p className='period-timespan'>
                                {moment(currentPeriodReturnInfo.periodEnd.date).format('MM-DD-YYYY')}
                              </p>
                              <p className='stock-start-end'>
                                {'Stock End: '}
                                {formatDollars({ value: currentPeriodReturnInfo.periodEnd.close, space: false })}
                              </p>
                            </Col>
                          </Row>
                        </Fragment>
                      ) : null;

                      const NUMBER_OF_CARDS_TO_COL_SPAN_MAP = {
                        12: { lg: { span: 12, offset: 0 }, xs: { span: 24 } },
                        4: { lg: { span: 12, offset: 0 }, xs: { span: 24 } },
                        2: { lg: { span: 12, offset: 0 }, xs: { span: 24 } },
                        1: { lg: { span: 20, offset: 2 }, xs: { span: 24 } },
                      };

                      const spanInfo = NUMBER_OF_CARDS_TO_COL_SPAN_MAP[numberOfCards];

                      return (
                        <Col key={cardIdx} {...spanInfo}>
                          <Card className='espp-period-profits-card' loading={loadingStockData}>
                            <Card.Meta description={description} />
                          </Card>
                        </Col>
                      );
                    }, R.times(R.identity, numberOfCards))
                  )
                )}
              </Col>
            </Row>
          </Spin>
        </div>
      );
    }
  },
});
