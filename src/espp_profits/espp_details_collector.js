import React, { Component } from 'react';
import moment from 'moment';
import * as R from 'ramda';
import { Button, Col, DatePicker, Form, Input, InputNumber, Radio, Row, Spin, Select } from 'antd';
import axios from 'axios';
import validator from 'validator';
import { ESPPCalculatorTooltip } from './espp_calculator_helper_components';

import filter from './filter';
import './espp_details_collector.css';
import config from '../config';
import { formatDollars } from '../lib/helpers';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES },
} = config;

const ZAPIER_WEBHOOK_ID = '403974/lpw5s0';

const TICKET_TYPES = { COMMON_STOCK: 'cs' };

stateManagerContainer.getStateManager({ name: STATE_MANAGER_NAMES.COMPANY_INFO }).asyncUpdate(async () => {
  const { data: companyInfo } = await axios.get('https://api.iextrading.com/1.0/ref-data/symbols');

  const commonStockCompanies = R.filter(({ type }) => type === TICKET_TYPES.COMMON_STOCK, companyInfo);
  const tickersPlusNames = R.map(({ symbol, name }) => `${symbol}||${name}`, commonStockCompanies);

  const symbolDisplayNames = R.fromPairs(
    R.map(({ symbol, name }) => [ symbol, `${name} | ${symbol}` ], commonStockCompanies)
  );

  const symbolToNameMap = R.reduce(
    (accum, { symbol, name }) => {
      accum[symbol] = name;
      return accum;
    },
    {},
    commonStockCompanies
  );

  return {
    commonStockCompanies,
    symbolDisplayNames,
    symbolToNameMap,
    tickersPlusNames,
  };
});

stateManagerContainer.getStateManager({ name: STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS }).syncUpdate({
  contributionPercentage: 0.15,
  company: undefined,
  email: '',
  discount: 0.15,
  income: 60000,
  lookback: true,
  periodStartDate: moment()
    .add(-1, 'years')
    .add(-1, 'weeks'),
  periodCadenceInMonths: 3,
});

export const ESPPDetailsCollector = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.COMPANY_INFO, STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS ],
  WrappedComponent: class ESPPDetailsCollector extends Component {
    constructor(props) {
      super(props);

      this.state = {
        companySearchValue: '',
      };

      this.companyInfoStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.COMPANY_INFO];
      this.esppProfitsModelInputsStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS];
    }

    renderFormLabelWithTooltip({ label, tooltip }) {
      return (
        <span>
          {`${label} `}
          <ESPPCalculatorTooltip tooltipText={tooltip} />
        </span>
      );
    }

    renderCompanySelect(esppProfitsModel) {
      const [ companies, tickersPlusNames, symbolDisplayNames ] = R.map(
        ([ field, defaultValue ]) => R.propOr(defaultValue, field, this.companyInfoStateManager.getData()),
        [ [ 'commonStockCompanies', [] ], [ 'tickersPlusNames', [] ], [ 'symbolDisplayNames', {} ] ]
      );

      const filteredCompaniesIdx = filter(this.state.companySearchValue || '', tickersPlusNames, {
        limit: 20,
        mark: false,
      }).items;

      const filteredCompanies = R.map(R.nth(R.__, companies), filteredCompaniesIdx);

      return (
        <Select
          defaultValue={symbolDisplayNames[esppProfitsModel.company]}
          defaultActiveFirstOption={false}
          filterOption={false}
          notFoundContent={null}
          onSearch={companySearchValue => this.setState({ companySearchValue })}
          onChange={selectedCompany => this.esppProfitsModelInputsStateManager.syncUpdate({ company: selectedCompany })}
          placeholder={'Select a company'}
          showArrow={true}
          showSearch
        >
          {R.map(({ symbol }) => {
            return (
              <Select.Option key={symbol} value={symbol}>
                {symbolDisplayNames[symbol]}
              </Select.Option>
            );
          }, filteredCompanies)}
        </Select>
      );
    }

    selectAllOnFocus(event) {
      const input = event.target;
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(0, input.value.length);
      }, 0);
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
      const loadingCompanyInfo = this.companyInfoStateManager.isLoading();

      const esppProfitsModel = this.esppProfitsModelInputsStateManager.getData();
      const profitsModelValidation = this.validateProfitsModel(esppProfitsModel);

      return (
        <div className='espp-details-collector-container'>
          <div className='header-description-container'>
            <Row type='flex' justify='center'>
              <Col span={15}>
                <p>
                  Created by <strong>Cake Financials</strong>
                </p>
                <p>
                  How much money can you make with your company’s Employee Stock Purchase Plan? We built this calculator
                  so that you can see how much money you are missing out on by not participating in your company’s
                  Employee Stock Purchase Plan. Enter your company’s ESPP details below and our calculator will show you
                  how much money you would have made last year using Cake to enroll in your ESPP.*
                </p>
              </Col>
            </Row>
          </div>
          <div className='form-container'>
            <Spin spinning={loadingCompanyInfo}>
              <Row type='flex' justify='center'>
                <Col span={20}>
                  <Form layout='vertical'>
                    {/* WTF FUCK AUTOFOCUS!!! */}
                    <input type='text' autoFocus='autofocus' style={{ display: 'none' }} />
                    <Form.Item
                      label={'Email'}
                      validateStatus={profitsModelValidation.email ? 'success' : 'error'}
                      help={profitsModelValidation.email ? '' : 'Please input a valid email'}
                    >
                      <Input
                        autoFocus={false}
                        value={esppProfitsModel.email}
                        onChange={event => {
                          const email = event.target.value || '';
                          this.esppProfitsModelInputsStateManager.syncUpdate({ email });
                        }}
                        onFocus={this.selectAllOnFocus}
                        style={{ minWidth: '120px' }}
                      />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={'Company'}
                          validateStatus={profitsModelValidation.company ? 'success' : 'error'}
                          help={profitsModelValidation.company ? '' : 'Please select a company'}
                        >
                          {this.renderCompanySelect(esppProfitsModel)}
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={this.renderFormLabelWithTooltip({
                            label: 'Last year’s income',
                            tooltip: TOOLTIP_TEXTS.YEARLY_INCOME,
                          })}
                          validateStatus={profitsModelValidation.income ? 'success' : 'error'}
                          help={profitsModelValidation.income ? '' : 'Please enter your yearly income'}
                        >
                          <InputNumber
                            autoFocus={false}
                            value={esppProfitsModel.income}
                            formatter={value => formatDollars({ value: parseFloat(value), digits: 0 })}
                            min={0}
                            max={1000000}
                            onChange={income => this.esppProfitsModelInputsStateManager.syncUpdate({ income })}
                            onFocus={this.selectAllOnFocus}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            style={{ minWidth: '120px' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={this.renderFormLabelWithTooltip({
                            label: 'Purchase Period Start Date',
                            tooltip: TOOLTIP_TEXTS.PERIOD_START,
                          })}
                          validateStatus={profitsModelValidation.periodStartDate ? 'success' : 'error'}
                          help={profitsModelValidation.periodStartDate ? '' : 'Please select the period start date'}
                        >
                          <DatePicker
                            defaultValue={esppProfitsModel.periodStartDate}
                            disabledDate={c =>
                              c >
                              moment()
                                .add(-1, 'years')
                                .add(-1, 'weeks')
                            }
                            format={'MMM DD, YYYY'}
                            showToday={false}
                            onChange={periodStartDate =>
                              this.esppProfitsModelInputsStateManager.syncUpdate({ periodStartDate })
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={this.renderFormLabelWithTooltip({
                            label: 'Lookback',
                            tooltip: TOOLTIP_TEXTS.LOOKBACK,
                          })}
                        >
                          <Radio.Group
                            defaultValue={`${esppProfitsModel.lookback}`}
                            onChange={({ target: { value } }) =>
                              this.esppProfitsModelInputsStateManager.syncUpdate({ lookback: value === 'true' })
                            }
                          >
                            <Radio.Button value='true'>YES</Radio.Button>
                            <Radio.Button value='false'>NO</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      label={this.renderFormLabelWithTooltip({
                        label: 'Purchase Period Cadence',
                        tooltip: TOOLTIP_TEXTS.PERIOD_CADENCE,
                      })}
                    >
                      <Radio.Group
                        defaultValue={`${esppProfitsModel.periodCadenceInMonths}`}
                        onChange={({ target: { value } }) =>
                          this.esppProfitsModelInputsStateManager.syncUpdate({
                            periodCadenceInMonths: parseInt(value, 10),
                          })
                        }
                      >
                        <Radio.Button value='1'>1 Month</Radio.Button>
                        <Radio.Button value='3'>3 Months</Radio.Button>
                        <Radio.Button value='6'>6 Months</Radio.Button>
                        <Radio.Button value='12'>12 Months</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={this.renderFormLabelWithTooltip({
                            label: 'ESPP Discount',
                            tooltip: TOOLTIP_TEXTS.ESPP_DISCOUNT,
                          })}
                          validateStatus={profitsModelValidation.discount ? 'success' : 'error'}
                          help={profitsModelValidation.discount ? '' : 'Please enter your ESPP plan discount'}
                        >
                          <InputNumber
                            autoFocus={false}
                            value={esppProfitsModel.discount * 100}
                            formatter={value => `${Math.floor(value)}%`}
                            min={0}
                            max={25}
                            onChange={discount => {
                              if (discount !== undefined) {
                                this.esppProfitsModelInputsStateManager.syncUpdate({
                                  discount: Math.floor(discount) / 100,
                                });
                              }
                            }}
                            onFocus={this.selectAllOnFocus}
                            parser={value => value.replace('%', '')}
                            style={{ minWidth: '120px' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          label={this.renderFormLabelWithTooltip({
                            label: 'Max Contribution Percentage',
                            tooltip: TOOLTIP_TEXTS.MAX_CONTRIBUTION_PERCENTAGE,
                          })}
                          validateStatus={profitsModelValidation.contributionPercentage ? 'success' : 'error'}
                          help={
                            profitsModelValidation.contributionPercentage ? '' : 'Please enter your ESPP plan discount'
                          }
                        >
                          <InputNumber
                            autoFocus={false}
                            value={esppProfitsModel.contributionPercentage * 100}
                            formatter={value => `${Math.floor(value)}%`}
                            min={0}
                            max={25}
                            onChange={contributionPercentage => {
                              if (contributionPercentage !== undefined) {
                                this.esppProfitsModelInputsStateManager.syncUpdate({
                                  contributionPercentage: Math.floor(contributionPercentage) / 100,
                                });
                              }
                            }}
                            onFocus={this.selectAllOnFocus}
                            parser={value => value.replace('%', '')}
                            style={{ minWidth: '120px' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12} offset={6}>
                        <Button
                          block
                          disabled={R.any(R.equals(false), R.values(profitsModelValidation))}
                          onClick={() => {
                            axios.post(config.apiGateway.proxyZapierWebhookURL, {
                              zapierWebhookId: ZAPIER_WEBHOOK_ID,
                              zapierPostBody: {
                                slackChannel: config.calculatorResponseSlackChannelName,
                                esppProfitsModel,
                              },
                            });

                            this.props.doneCollectingData();
                          }}
                          size='large'
                          type='primary'
                        >
                          {'Let\'s go!'}
                        </Button>
                      </Col>
                    </Row>
                    <Row className='dont-know-espp-details-tooltip-container'>
                      <ESPPCalculatorTooltip
                        tooltipText={
                          'Sometimes these are publicly available, if not, try searching for ESPP or ESOP within your employee portal. Lastly, you can always inquire with your benefits and compensation department. There is no harm in trying some values now to get a ballpark estimate and then coming back to the tool with exact details once ready.'
                        }
                        child={
                          <i>
                            <a>{'What if I don\'t know my ESPP details?'}</a>
                          </i>
                        }
                      />
                    </Row>
                  </Form>
                </Col>
              </Row>
            </Spin>
          </div>
        </div>
      );
    }
  },
});

const TOOLTIP_TEXTS = {
  PERIOD_START:
    'This is at least 1 year in the past. In order to get the most accurate results, use the actual purchase period start date closest to 1 year ago. If you don’t know it, a good rule of thumb to get close-to-accurate results is to find the most recent past purchase period start date and select the date exactly 1 year before that.',
  YEARLY_INCOME:
    'If you include bonuses in this total, please note that our tool will average that bonus amount across all purchase periods, when in reality it would hit during a specific period. We are working on a v2 of this tool that will allow you to specify a bonus date.',
  LOOKBACK:
    'Does your company ESPP have lookback? The lookback provision applies your ESPP discount to the cost of stock at the lowest between (1) the closing price on the first day of the purchase/offering period; or (2) the closing price on the purchase date. ',
  PERIOD_CADENCE:
    'How many purchase periods does your ESPP plan have in a year. This will not matter unless your ESPP has lookback. If you are unsure, 6 months is the most common.',
  ESPP_DISCOUNT: 'This is a value specific to your company. It is never more than 15%.',
  MAX_CONTRIBUTION_PERCENTAGE:
    'This is the maximum % of your earnings that you are allowed to contribute towards your ESPP.',
};
