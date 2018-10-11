import React, { Component } from 'react';
import moment from 'moment';
import * as R from 'ramda';
import { DatePicker, Form, Spin, Select } from 'antd';
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

esppProfitsModelInputsStateManager.syncUpdate({ periodStartDate: moment().add(-1, 'year') });

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

        return (
            <div className='espp-details-collector-container'>
                <h1>COLLECTOR!!!</h1>
                <Spin spinning={ loadingCompanyInfo }>
                    <Form>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Company' }
                            validateStatus={ !esppProfitsModel.company ? 'error' : 'success' }
                            help={ !esppProfitsModel.company ? 'Please select a company' : null }
                        >
                            { this.renderCompanySelect() }
                        </Form.Item>
                        <Form.Item
                            {...formItemLayout}
                            label={ 'Period Start Date' }
                            validateStatus={ !esppProfitsModel.periodStartDate ? 'error' : 'success' }
                            help={ !esppProfitsModel.periodStartDate ? 'Please select the period start date' : null }
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
                    </Form>
                </Spin>
            </div>
        );
    }
}
