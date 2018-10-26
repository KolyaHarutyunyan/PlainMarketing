import React, { Component, Fragment } from 'react';
import * as R from 'ramda';
import {
    Card,
    Col,
    Row,
    Spin,
} from 'antd';
import axios from 'axios';

import { STATE_MANAGERS } from '../lib/state_manager';
import * as returnCalculator from '../lib/return_calculator';
import { formatDollars } from '../lib/helpers';

const {
    ESPP_PROFITS_MODEL_INPUTS: esppProfitsModelInputsStateManager,
    STOCK_DATA: stockDataStateManager,
} = STATE_MANAGERS;

const get5YDataUrl = (companyTicker) => `https://api.iextrading.com/1.0/stock/${companyTicker}/chart/5y`;

export class ESPPProfitsDisplay extends Component {
    constructor(props) {
        super(props);

        this.state = {
            stockData: stockDataStateManager.getCurrentState(),
        };
    }

    async componentDidMount() {
        this.stockDataUnsub = stockDataStateManager.subscribe((stockData) => {
            this.setState({ stockData });
        });

        stockDataStateManager.asyncUpdate(async () => {
            const esppProfitsModel = esppProfitsModelInputsStateManager.getCurrentState().data;

            const fiveYearStockData = (await axios.get(get5YDataUrl(esppProfitsModel.company))).data;

            const args = R.merge(
                { stockData: fiveYearStockData, },
                R.pick(
                    [
                        'periodStartDate',
                        'periodCadenceInMonths',
                        'income',
                        'lookback',
                        'discount',
                        'contributionPercentage',
                    ],
                    esppProfitsModel
                )
            );

            const returnInfo = returnCalculator.calculateESPPEarnings(args);

            return { fiveYearStockData, returnInfo };
        });
    }

    componentWillUnmount() {
        this.stockDataUnsub();
    }

    render() {
        const loadingStockData = R.pathOr(
            true,
            [ 'stockData', 'loading' ],
            this.state
        );

        const returnInfo = R.pathOr(
            null,
            [ 'stockData', 'data', 'returnInfo' ],
            this.state
        );

        const { periodCadenceInMonths } = esppProfitsModelInputsStateManager.getCurrentState().data;
        const numberOfCards = 12 / periodCadenceInMonths;

        return (
            <div className='espp-profits-display-container' style={{ background: '#ECECEC', padding: '30px' }}>
                <Spin spinning={ loadingStockData }>
                    <Row gutter={16}>
                        {
                            R.map(
                                (cardIdx) => {
                                    const currentPeriodReturnInfo = returnInfo && returnInfo[cardIdx];
                                    const title = returnInfo && `Period Ending on ${currentPeriodReturnInfo.periodEnd.esppPeriodDate}`;
                                    const description = returnInfo && (
                                        <Fragment>
                                            <p>Contribution During Period: { formatDollars({ value: currentPeriodReturnInfo.contributionThisPeriod }) }</p>
                                            <p>Money Made By Client: { formatDollars({ value: currentPeriodReturnInfo.moneyMadeByClient }) }</p>
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
                                                <Card.Meta
                                                    title={title}
                                                    description={description}
                                                />
                                            </Card>
                                        </Col>
                                    );
                                },
                                R.times(R.identity, numberOfCards)
                            )
                        }
                    </Row>
                </Spin>
            </div>
        );
    }
}
