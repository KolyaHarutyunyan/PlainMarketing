import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import { Button, Card, Col, Icon, Row, Spin } from 'antd';
import axios from 'axios';
import moment from 'moment';

import config from '../config';
import * as returnCalculator from '../lib/return_calculator';
import { formatDollars } from '../lib/helpers';

import './espp_profits_display.css';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES },
} = config;

const get5YDataUrl = companyTicker => `https://api.iextrading.com/1.0/stock/${companyTicker}/chart/5y`;

export const ESPPProfitsDisplay = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS, STATE_MANAGER_NAMES.STOCK_DATA ],
  WrappedComponent: class ESPPProfitsDisplay extends Component {
    constructor(props) {
      super(props);

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

      return (
        <Row className='return-info-summary-container'>
          <Col span={6}>
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
          <Col span={12}>
            {loadingStockData ? (
              <Card loading={true}> </Card>
            ) : (
              <Fragment>
                <Row type='flex' justify='center' align='middle'>
                  <div className='last-year-container'>
                    <p>Last year you would have made:</p>
                    <p className='earnings'>{formatDollars({ value: dollarsEarnedLastYear })}</p>
                    <p>
                      via your ESPP by using <strong>Cake Financials</strong>
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
              <Col span={16} offset={4}>
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
                          <Row type='flex' justify='center' align='middle'>
                            <Col span={6}>
                              <p className={`period-label ${numberOfCards === 4 ? 'period-label-quarterly' : ''}`}>
                                {NUMBER_OF_CARDS_TO_LABEL_MAP[numberOfCards](cardIdx)}
                              </p>
                              <p className='period-timespan'>
                                {moment(currentPeriodReturnInfo.periodStart.date).format('MM-DD-YYYY')}
                                <br />
                                to
                                <br />
                                {moment(currentPeriodReturnInfo.periodEnd.date).format('MM-DD-YYYY')}
                              </p>
                            </Col>
                            <Col span={18}>
                              <p className='period-gain-in-dollars'>
                                + {formatDollars({ value: currentPeriodReturnInfo.moneyMadeByClient, space: false })}
                              </p>
                              <p className='stock-start-end'>
                                {'Stock Start: '}
                                {formatDollars({ value: currentPeriodReturnInfo.periodStart.close, space: false })}
                                <br />
                                {'Stock End: '}
                                {formatDollars({ value: currentPeriodReturnInfo.periodEnd.close, space: false })}
                              </p>
                            </Col>
                          </Row>
                        </Fragment>
                      ) : null;

                      const NUMBER_OF_CARDS_TO_COL_SPAN_MAP = {
                        12: { span: 12, offset: 0 },
                        4: { span: 12, offset: 0 },
                        2: { span: 12, offset: 0 },
                        1: { span: 20, offset: 2 },
                      };

                      const spanInfo = NUMBER_OF_CARDS_TO_COL_SPAN_MAP[numberOfCards];

                      return (
                        <Col key={cardIdx} span={spanInfo.span} offset={spanInfo.offset}>
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
