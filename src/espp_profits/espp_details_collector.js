import React, { Component } from 'react';
import moment from 'moment';
import * as R from 'ramda';
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Radio,
    Row,
    Tooltip,
    Spin,
    Select
} from 'antd';
import axios from 'axios';
import validator from 'validator';
import { getStateManager, withStateManagers, STATE_MANAGER_NAMES } from '../lib/state_manager';

import filter from './filter';
import './espp_details_collector.css';
import config from '../config';
import { formatDollars } from '../lib/helpers';

const ZAPIER_WEBHOOK_ID = '403974/lpw5s0';

const TICKET_TYPES = { COMMON_STOCK: 'cs' };

getStateManager({ name: STATE_MANAGER_NAMES.COMPANY_INFO }).asyncUpdate(async () => {
    const { data: companyInfo } = await axios.get('https://api.iextrading.com/1.0/ref-data/symbols');

    const commonStockCompanies = R.filter(({ type }) => type === TICKET_TYPES.COMMON_STOCK, companyInfo);
    const tickersPlusNames = R.map(({ symbol, name }) => `${symbol}||${name}`, commonStockCompanies);

    const symbolDisplayNames = R.fromPairs(
        R.map(
            ({ symbol, name }) => [ symbol, `${name} | ${symbol}` ],
            commonStockCompanies
        )
    );

    return {
        commonStockCompanies,
        symbolDisplayNames,
        tickersPlusNames,
    };
});

getStateManager({ name: STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS }).syncUpdate({
    contributionPercentage: 0.15,
    company: undefined,
    email: '',
    discount: 0.15,
    income: 60000,
    lookback: true,
    periodStartDate: moment().add(-1, 'years').add(-1, 'weeks'),
    periodCadenceInMonths: 6,
});
export const ESPPDetailsCollector = withStateManagers({
    stateManagerNames: [
        STATE_MANAGER_NAMES.COMPANY_INFO,
        STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS,
    ],
    WrappedComponent: class ESPPDetailsCollector extends Component {
        constructor(props) {
            super(props);

            this.state = {
                companySearchValue: '',
            };

            this.companyInfoStateManager = () => this.props.stateManagers[STATE_MANAGER_NAMES.COMPANY_INFO];
            this.esppProfitsModelInputsStateManager = () => this.props.stateManagers[STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS];
        }

        renderCompanySelect(esppProfitsModel) {
            const companies = R.pathOr([], [ 'data', 'commonStockCompanies' ], this.companyInfoStateManager().state);
            const tickersPlusNames = R.pathOr([], [ 'data', 'tickersPlusNames' ], this.companyInfoStateManager().state);
            const symbolDisplayNames = R.pathOr({}, [ 'data', 'symbolDisplayNames' ], this.companyInfoStateManager().state);

            const filteredCompaniesIdx = filter(
                this.state.companySearchValue || '',
                tickersPlusNames,
                { limit: 20, mark: false }
            ).items;

            const filteredCompanies = R.map(R.nth(R.__, companies), filteredCompaniesIdx);

            return <Select
                defaultValue={symbolDisplayNames[esppProfitsModel.company]}
                defaultActiveFirstOption={false}
                filterOption={false}
                notFoundContent={null}
                onSearch={(companySearchValue) => this.setState({ companySearchValue })}
                onChange={
                    (selectedCompany) => this.esppProfitsModelInputsStateManager().manager.syncUpdate({ company: selectedCompany })
                }
                placeholder={ 'Select a company' }
                showArrow={true}
                showSearch
            >
                {
                    R.map(({ symbol }) => {
                        return (
                            <Select.Option
                                key={ symbol }
                                value={ symbol }
                            >
                                { symbolDisplayNames[symbol] }
                            </Select.Option>
                        );
                    }, filteredCompanies)
                }
            </Select>;
        }

        selectAllOnFocus(event) {
            const input = event.target;
            setTimeout(
                () => {
                    input.focus();
                    input.setSelectionRange(0, input.value.length);
                },
                0
            );
        }

        validateProfitsModel(esppProfitsModel) {
            return R.evolve(
                {
                    contributionPercentage: R.complement(R.isNil),
                    company: R.complement(R.isNil),
                    email: validator.isEmail,
                    discount: R.complement(R.isNil),
                    income: R.complement(R.isNil),
                    lookback: R.complement(R.isNil),
                    periodCadenceInMonths: R.complement(R.isNil),
                    periodStartDate: R.complement(R.isNil),
                },
                esppProfitsModel
            );
        }

        render() {
            const loadingCompanyInfo = R.propOr(true, 'loading', this.companyInfoStateManager().state);

            const esppProfitsModel = R.propOr({}, 'data', this.esppProfitsModelInputsStateManager().state);
            const profitsModelValidation = this.validateProfitsModel(esppProfitsModel);

            return (
                <div className='espp-details-collector-container'>
                    <p>
                        <strong>
                            Cake Financials’ Employee Stock Purchase Plan (ESPP) Calculator
                        </strong>
                    </p>
                    <p>
                        How much money can you make with your company’s Employee Stock Purchase Plan? We built this calculator so that you can see how much money you are missing out on by not participating in your company’s Employee Stock Purchase Plan. Enter your company’s ESPP details below and our calculator will show you how much money you would have made last year using Cake to enroll in your ESPP.*
                    </p>

                    <p>
                        <strong>What is Cake?</strong>
                    </p>
                    <p>
                        Cake gives you interest-free money to invest in your Employee Stock Purchase Plan and manages your account to maximize annual returns.

                        Cake is completely free. If profits are made, we split them. It is about time that you have your cake and eat it too!
                    </p>
                    <Spin spinning={ loadingCompanyInfo }>
                        <Row type='flex' justify='center'>
                            <Col span={20}>
                                <Form layout='vertical'>
                                    <Form.Item
                                        label={ 'Email' }
                                        validateStatus={ profitsModelValidation.email ? 'success' : 'error' }
                                        help={ profitsModelValidation.email ? '' : 'Please input a valid email' }
                                    >
                                        <Input
                                            value={ esppProfitsModel.email }
                                            onChange={
                                                (event) => {
                                                    const email = event.target.value || '';
                                                    this.esppProfitsModelInputsStateManager().manager.syncUpdate({ email });
                                                }
                                            }
                                            onFocus={this.selectAllOnFocus}
                                            style={{ minWidth: '120px' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Purchase Period Start Date' }
                                        validateStatus={ profitsModelValidation.periodStartDate ? 'success' : 'error' }
                                        help={ profitsModelValidation.periodStartDate ? '' : 'Please select the period start date' }
                                    >
                                        <DatePicker
                                            defaultValue={ esppProfitsModel.periodStartDate }
                                            disabledDate={(c) => c > moment().add(-1, 'years').add(-1, 'weeks') }
                                            format={ 'MMM DD, YYYY' }
                                            showToday={ false }
                                            onChange={
                                                (periodStartDate) => this.esppProfitsModelInputsStateManager().manager.syncUpdate({ periodStartDate })
                                            }
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Company' }
                                        validateStatus={ profitsModelValidation.company ? 'success' : 'error' }
                                        help={ profitsModelValidation.company ? '' : 'Please select a company' }
                                    >
                                        { this.renderCompanySelect(esppProfitsModel) }
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Last year’s income (including bonus)' }
                                        validateStatus={ profitsModelValidation.income ? 'success' : 'error' }
                                        help={ profitsModelValidation.income ? '' : 'Please enter your yearly income' }
                                    >
                                        <InputNumber
                                            value={ esppProfitsModel.income }
                                            formatter={(value) => formatDollars({ value: parseFloat(value), digits: 0 })}
                                            min={0}
                                            max={1000000}
                                            onChange={
                                                (income) => this.esppProfitsModelInputsStateManager().manager.syncUpdate({ income })
                                            }
                                            onFocus={this.selectAllOnFocus}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                            style={{ minWidth: '120px' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Lookback' }
                                    >
                                        <Radio.Group
                                            defaultValue={ `${esppProfitsModel.lookback}` }
                                            onChange={
                                                ({ target: { value } }) => this.esppProfitsModelInputsStateManager().manager.syncUpdate({ lookback: value === 'true' })
                                            }
                                        >
                                            <Radio.Button value='true'>YES</Radio.Button>
                                            <Radio.Button value='false'>NO</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Purchase Period Cadence' }
                                    >
                                        <Radio.Group
                                            defaultValue={ `${esppProfitsModel.periodCadenceInMonths}` }
                                            onChange={
                                                ({ target: { value } }) => this.esppProfitsModelInputsStateManager().manager.syncUpdate({ periodCadenceInMonths: parseInt(value, 10) })
                                            }
                                        >
                                            <Radio.Button value='1'>1 Month</Radio.Button>
                                            <Radio.Button value='3'>3 Months</Radio.Button>
                                            <Radio.Button value='6'>6 Months</Radio.Button>
                                            <Radio.Button value='12'>12 Months</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'ESPP Discount' }
                                        validateStatus={ profitsModelValidation.discount ? 'success' : 'error' }
                                        help={ profitsModelValidation.discount ? '' : 'Please enter your ESPP plan discount' }
                                    >
                                        <InputNumber
                                            value={ esppProfitsModel.discount * 100 }
                                            formatter={value => `${Math.floor(value)}%`}
                                            min={0}
                                            max={25}
                                            onChange={
                                                (discount) => {
                                                    if (discount !== undefined) {
                                                        this.esppProfitsModelInputsStateManager().manager.syncUpdate({ discount: Math.floor(discount) / 100 });
                                                    }
                                                }
                                            }
                                            onFocus={this.selectAllOnFocus}
                                            parser={value => value.replace('%', '')}
                                            style={{ minWidth: '120px' }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label={ 'Max Contribution Percentage' }
                                        validateStatus={ profitsModelValidation.contributionPercentage ? 'success' : 'error' }
                                        help={ profitsModelValidation.contributionPercentage ? '' : 'Please enter your ESPP plan discount' }
                                    >
                                        <InputNumber
                                            value={ esppProfitsModel.contributionPercentage * 100 }
                                            formatter={value => `${Math.floor(value)}%`}
                                            min={0}
                                            max={25}
                                            onChange={
                                                (contributionPercentage) => {
                                                    if (contributionPercentage !== undefined) {
                                                        this.esppProfitsModelInputsStateManager().manager.syncUpdate({ contributionPercentage: Math.floor(contributionPercentage) / 100 });
                                                    }
                                                }
                                            }
                                            onFocus={this.selectAllOnFocus}
                                            parser={value => value.replace('%', '')}
                                            style={{ minWidth: '120px' }}
                                        />
                                    </Form.Item>
                                    <Row>
                                        <Col span={12} offset={6}>
                                            <Button
                                                block
                                                disabled={ R.any(R.equals(false), R.values(profitsModelValidation)) }
                                                onClick={() => {
                                                    axios.post(
                                                        config.apiGateway.proxyZapierWebhookURL,
                                                        {
                                                            zapierWebhookId: ZAPIER_WEBHOOK_ID,
                                                            zapierPostBody: {
                                                                slackChannel: config.calculatorResponseSlackChannelName,
                                                                esppProfitsModel
                                                            }
                                                        }
                                                    );

                                                    this.props.doneCollectingData();
                                                }}
                                                size='large'
                                                type='primary'
                                            >
                                                { 'Let\'s go!' }
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                                <Tooltip
                                    title={'Sometimes these are publicly available, if not, try searching for ESPP or ESOP within your employee portal. Lastly, you can always inquire with your benefits and compensation department. There is no harm in trying some values now to get a ballpark estimate and then coming back to the tool with exact details once ready.'}
                                >
                                    <i><a>{ 'What if I don\'t know my ESPP details?' }</a></i>
                                </Tooltip>
                            </Col>
                        </Row>
                    </Spin>
                </div>
            );
        }
    }
});
