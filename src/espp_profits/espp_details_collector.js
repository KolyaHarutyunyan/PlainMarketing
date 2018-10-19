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
    Spin,
    Select
} from 'antd';
import axios from 'axios';
import validator from 'validator';
import { STATE_MANAGERS } from '../lib/state_manager';

import filter from './filter';
import './espp_details_collector.css';
import config from '../config';

const ZAPIER_WEBHOOK_ID = '403974/lpw5s0';

const {
    COMPANY_INFO: companyInfoStateManager,
    ESPP_PROFITS_MODEL_INPUTS: esppProfitsModelInputsStateManager,
} = STATE_MANAGERS;

const TICKET_TYPES = { COMMON_STOCK: 'cs' };

companyInfoStateManager.asyncUpdate(async () => {
    const { data: companyInfo } = await axios.get('https://api.iextrading.com/1.0/ref-data/symbols');

    const commonStockCompanies = R.filter(({ type }) => type === TICKET_TYPES.COMMON_STOCK, companyInfo);
    const tickersPlusNames = R.map(({ symbol, name }) => `${symbol}||${name}`, commonStockCompanies);

    return {
        commonStockCompanies,
        tickersPlusNames
    };
});

esppProfitsModelInputsStateManager.syncUpdate({
    contributionPercentage: 0.10,
    company: undefined,
    email: '',
    discount: 0.15,
    income: 60000,
    lookback: true,
    periodStartDate: moment(),
    periodCadenceInMonths: 6,
});
export class ESPPDetailsCollector extends Component {
    constructor(props) {
        super(props);

        this.state = {
            companyInfo: companyInfoStateManager.getCurrentState(),
            esppProfitsModel: esppProfitsModelInputsStateManager.getCurrentState(),
        };
    }

    async componentDidMount() {
        this.companyInfoUnsub = companyInfoStateManager.subscribe((companyInfo) => {
            this.setState({ companyInfo });
        });

        this.esppProfitsModelUnsub = esppProfitsModelInputsStateManager.subscribe((esppProfitsModel) => {
            this.setState({ esppProfitsModel });
        });
    }

    renderCompanySelect() {
        const companies = R.pathOr([], [ 'companyInfo', 'data', 'commonStockCompanies' ], this.state);
        const tickersPlusNames = R.pathOr([], [ 'companyInfo', 'data', 'tickersPlusNames' ], this.state);

        const filteredCompaniesIdx = filter(
            this.state.companySearchValue || '',
            tickersPlusNames,
            { limit: 20, mark: false }
        ).items;

        const filteredCompanies = R.map(R.nth(R.__, companies), filteredCompaniesIdx);

        return <Select
            showSearch
            placeholder={ 'Select a company' }
            defaultActiveFirstOption={false}
            showArrow={true}
            filterOption={false}
            onSearch={(companySearchValue) => this.setState({ companySearchValue })}
            onChange={
                (selectedCompany) => esppProfitsModelInputsStateManager.syncUpdate({ company: selectedCompany })
            }
            notFoundContent={null}
        >
            {
                R.map(({ symbol, name }) => {
                    return (
                        <Select.Option
                            key={ symbol }
                            value={ symbol }
                        >
                            { `${name} | ${symbol}` }
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
        const loadingCompanyInfo = R.pathOr(
            true,
            [ 'companyInfo', 'loading' ],
            this.state
        );

        const esppProfitsModel = R.pathOr({}, [ 'esppProfitsModel', 'data' ], this.state);
        const profitsModelValidation = this.validateProfitsModel(esppProfitsModel);

        return (
            <div className='espp-details-collector-container'>
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
                                                esppProfitsModelInputsStateManager.syncUpdate({ email });
                                            }
                                        }
                                        onFocus={this.selectAllOnFocus}
                                        style={{ minWidth: '120px' }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label={ 'Period Start Date' }
                                    validateStatus={ profitsModelValidation.periodStartDate ? 'success' : 'error' }
                                    help={ profitsModelValidation.periodStartDate ? '' : 'Please select the period start date' }
                                >
                                    <DatePicker
                                        defaultValue={ esppProfitsModel.periodStartDate }
                                        disabledDate={(c) => c > moment() }
                                        format={ 'MMM DD, YYYY' }
                                        showToday={ false }
                                        onChange={
                                            (periodStartDate) => esppProfitsModelInputsStateManager.syncUpdate({ periodStartDate })
                                        }
                                    />
                                </Form.Item>
                                <Form.Item
                                    label={ 'Company' }
                                    validateStatus={ profitsModelValidation.company ? 'success' : 'error' }
                                    help={ profitsModelValidation.company ? '' : 'Please select a company' }
                                >
                                    { this.renderCompanySelect() }
                                </Form.Item>
                                <Form.Item
                                    label={ 'Yearly Income' }
                                    validateStatus={ profitsModelValidation.income ? 'success' : 'error' }
                                    help={ profitsModelValidation.income ? '' : 'Please enter your yearly income' }
                                >
                                    <InputNumber
                                        value={ esppProfitsModel.income }
                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        min={0}
                                        max={1000000}
                                        onChange={
                                            (income) => esppProfitsModelInputsStateManager.syncUpdate({ income })
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
                                            ({ target: { value } }) => esppProfitsModelInputsStateManager.syncUpdate({ lookback: value === 'true' })
                                        }
                                    >
                                        <Radio.Button value='true'>YES</Radio.Button>
                                        <Radio.Button value='false'>NO</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item
                                    label={ 'Period Cadence' }
                                >
                                    <Radio.Group
                                        defaultValue={ `${esppProfitsModel.periodCadenceInMonths}` }
                                        onChange={
                                            ({ target: { value } }) => esppProfitsModelInputsStateManager.syncUpdate({ periodCadenceInMonths: parseInt(value) })
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
                                                    esppProfitsModelInputsStateManager.syncUpdate({ discount: Math.floor(discount) / 100 });
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
                                                    esppProfitsModelInputsStateManager.syncUpdate({ contributionPercentage: Math.floor(contributionPercentage) / 100 });
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
                                                    { zapierWebhookId: ZAPIER_WEBHOOK_ID, zapierPostBody: esppProfitsModel }
                                                );
                                            }}
                                            size='large'
                                            type='primary'
                                        >
                                            { 'Let\'s go!' }
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>
                    </Row>
                </Spin>
            </div>
        );
    }
}
