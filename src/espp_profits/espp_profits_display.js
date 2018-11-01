import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import { Card, Col, Row, Spin } from 'antd';
import axios from 'axios';

import * as returnCalculator from '../lib/return_calculator';
import { formatDollars } from '../lib/helpers';

import { withStateManagers, STATE_MANAGER_NAMES } from '../lib/state_manager';

const get5YDataUrl = companyTicker => `https://api.iextrading.com/1.0/stock/${companyTicker}/chart/5y`;

export const ESPPProfitsDisplay = withStateManagers({
  stateManagerNames: [STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS, STATE_MANAGER_NAMES.STOCK_DATA],
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
            ['periodStartDate', 'periodCadenceInMonths', 'income', 'lookback', 'discount', 'contributionPercentage'],
            esppProfitsModel
          )
        );

        const returnInfo = returnCalculator.calculateESPPEarnings(args);

        return { fiveYearStockData, returnInfo };
      });
    }

    render() {
      const loadingStockData = this.stockDataStateManager.isLoading();

      const returnInfo = R.propOr(null, 'returnInfo', this.stockDataStateManager.getData());

      const { periodCadenceInMonths } = this.esppProfitsModelInputsStateManager.getData();
      const numberOfCards = 12 / periodCadenceInMonths;

      return (
        <div className="espp-profits-display-container" style={{ background: '#ECECEC', padding: '30px' }}>
          <Spin spinning={loadingStockData}>
            <Row gutter={16}>
              {R.map(cardIdx => {
                const currentPeriodReturnInfo = returnInfo && returnInfo[cardIdx];
                const title = returnInfo && `Period Ending on ${currentPeriodReturnInfo.periodEnd.esppPeriodDate}`;
                const description = returnInfo && (
                  <Fragment>
                    <p>
                      Contribution During Period:{' '}
                      {formatDollars({ value: currentPeriodReturnInfo.contributionThisPeriod })}
                    </p>
                    <p>Money Made By Client: {formatDollars({ value: currentPeriodReturnInfo.moneyMadeByClient })}</p>
                    <textarea
                      readOnly
                      style={{ minWidth: '100%' }}
                      value={JSON.stringify(currentPeriodReturnInfo, null, 4)}
                    />
                  </Fragment>
                );

                return (
                  <Col key={cardIdx} span={24 / numberOfCards}>
                    <Card loading={loadingStockData}>
                      <Card.Meta title={title} description={description} />
                    </Card>
                  </Col>
                );
              }, R.times(R.identity, numberOfCards))}
            </Row>
          </Spin>
        </div>
      );
    }
  },
});
