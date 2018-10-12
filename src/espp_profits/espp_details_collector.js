import React, { Component } from 'react';
import moment from 'moment';
import * as R from 'ramda';
import { DatePicker, Form, InputNumber, Radio, Spin, Select } from 'antd';
import axios from 'axios';
import { STATE_MANAGERS } from '../lib/state_manager';

import filter from './filter';

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
    discount: 0.15,
    lookback: true,
    periodStartDate: moment().add(-1, 'year'),
    periodCadenceInMonths: 6,
    income: 60000,
});

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
    },
};

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

    render() {
        const loadingCompanyInfo = R.pathOr(
            true,
            [ 'companyInfo', 'loading' ],
            this.state
        );

        const esppProfitsModel = R.pathOr({}, [ 'esppProfitsModel', 'data' ], this.state);

        console.log(esppProfitsModel);

        return (
            <div className='espp-details-collector-container'>
                <h1>COLLECTOR!!!</h1>
                <Spin spinning={ loadingCompanyInfo }>
                    <Form>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Company' }
                            validateStatus={ !esppProfitsModel.company ? 'error' : 'success' }
                            help={ !esppProfitsModel.company ? 'Please select a company' : '' }
                        >
                            { this.renderCompanySelect() }
                        </Form.Item>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Period Start Date' }
                            validateStatus={ !esppProfitsModel.periodStartDate ? 'error' : 'success' }
                            help={ !esppProfitsModel.periodStartDate ? 'Please select the period start date' : '' }
                        >
                            <DatePicker
                                defaultValue={ esppProfitsModel.periodStartDate }
                                disabledDate={(c) =>  c > moment().add(-1, 'year') }
                                format={ 'MMM DD, YYYY' }
                                showToday={ false }
                                onChange={
                                    (periodStartDate) => esppProfitsModelInputsStateManager.syncUpdate({ periodStartDate })
                                }
                            />
                        </Form.Item>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Yearly Income' }
                            validateStatus={ esppProfitsModel.income === undefined ? 'error' : 'success' }
                            help={ esppProfitsModel.income === undefined ? 'Please enter your yearly income' : null }
                        >
                            <InputNumber
                                value={ esppProfitsModel.income }
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                min={0}
                                max={1000000}
                                onChange={
                                    (income) => esppProfitsModelInputsStateManager.syncUpdate({ income })
                                }
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                style={{ minWidth: '120px' }}
                            />
                        </Form.Item>
                        <Form.Item
                            {...formItemLayout}
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
                            {...formItemLayout}
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
                            {...formItemLayout}
                            label={ 'ESPP Discount' }
                            validateStatus={ esppProfitsModel.discount === undefined ? 'error' : 'success' }
                            help={ esppProfitsModel.discount === undefined ? 'Please enter your ESPP plan discount' : null }
                        >
                            <InputNumber
                                value={ esppProfitsModel.discount * 100 }
                                formatter={value => `${value}%`}
                                min={0}
                                max={25}
                                onChange={
                                    (discount) => {
                                        if (discount !== undefined) {
                                            esppProfitsModelInputsStateManager.syncUpdate({ discount: discount / 100 })
                                        }
                                    }
                                }
                                parser={value => value.replace('%', '')}
                                style={{ minWidth: '120px' }}
                            />
                        </Form.Item>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Max Contribution Percentage' }
                            validateStatus={ esppProfitsModel.contributionPercentage === undefined ? 'error' : 'success' }
                            help={ esppProfitsModel.contributionPercentage === undefined ? 'Please enter your ESPP plan discount' : null }
                        >
                            <InputNumber
                                value={ esppProfitsModel.contributionPercentage * 100 }
                                formatter={value => `${value}%`}
                                min={0}
                                max={25}
                                onChange={
                                    (contributionPercentage) => {
                                        if (contributionPercentage !== undefined) {
                                            esppProfitsModelInputsStateManager.syncUpdate({ contributionPercentage: contributionPercentage / 100 })
                                        }
                                    }
                                }
                                parser={value => value.replace('%', '')}
                                style={{ minWidth: '120px' }}
                            />
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        );
    }
}
