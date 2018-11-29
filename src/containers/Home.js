import React, { Component, Fragment } from 'react';
import { Col, Row } from 'antd';
import moment from 'moment';
import queryString from 'query-string';
import * as R from 'ramda';
import { Redirect } from 'react-router-dom';

import config from '../config';
import { ESPPDetailsCollector } from '../espp_profits/espp_details_collector';
import { ESPPProfitsDisplay } from '../espp_profits/espp_profits_display';
import { MethodologyExpander } from '../espp_profits/methodology_expander';

import './Home.css';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES },
} = config;

const HomeTemplate = ({ mainComponent, footer }) => {
  return (
    <div className='home-container'>
      <div className='lander'>
        <Row className='espp-header-container'>
          <a href='http://cakefinancials.com/get-started/' rel='noopener noreferrer' target='_blank'>
            <div className='cake-logo-with-words-container' />
          </a>
          <p>
            Employee Stock Purchase Plan <br /> (ESPP) Calculator
          </p>
        </Row>
        {mainComponent}
        <MethodologyExpander />
      </div>
      <Row className='espp-calculator-footer' type='flex' justify='center'>
        <Col xs={22} sm={16}>
          <Row type='flex' justify='center'>
            <Col className='espp-standalone-logo-container' />
          </Row>
          <Row type='flex' justify='center'>
            {footer}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

const DEFAULT_ESPP_INPUTS_STATE = {
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
};

const ESPP_INPUT_URL_PARSE_EVOLVERS = {
  contributionPercentage: parseFloat,
  company: R.identity,
  email: R.identity,
  discount: parseFloat,
  income: parseInt,
  lookback: b => b === 'true',
  periodStartDate: moment,
  periodCadenceInMonths: parseInt,
};

const ESPP_INPUTS_URL_WRITE_EVOLVERS = {
  periodStartDate: d => moment(d).toISOString(),
};

const esppProfitsModelInputsStateManager = stateManagerContainer.getStateManager({
  name: STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS,
});

esppProfitsModelInputsStateManager.syncUpdate(DEFAULT_ESPP_INPUTS_STATE);

window.brianLuscombeIsAWanker = () => {
  console.log('that must sting, bro');
  const esppInputs = esppProfitsModelInputsStateManager.getData();

  const evolvedInputs = R.evolve(ESPP_INPUTS_URL_WRITE_EVOLVERS, esppInputs);
  const url = `${window.location.protocol}//${window.location.host}/espp?${queryString.stringify(evolvedInputs)}`;
  console.log(url);
};

export class HomeCollector extends Component {
  constructor(props) {
    super(props);

    this.state = { doneCollectingData: false };
  }

  renderFooter() {
    return (
      <Fragment>
        <p className='footer-header-text'>
          {'What is '}
          <a href='http://cakefinancials.com/get-started/' rel='noopener noreferrer' target='_blank'>
            Cake Financials
          </a>
          ?
        </p>
        <p>
          What is Cake Financials? Cake gives you interest-free money to invest in your Employee Stock Purchase Plan and
          manages your account to maximize annual returns. Cake is completely free. If profits are made, we split them.
          It is about time that you have your cake and eat it too!
        </p>
      </Fragment>
    );
  }

  render() {
    if (this.props.location.search !== '') {
      const parsedQuery = queryString.parse(this.props.location.search);

      const overlappingInputs = R.pick(R.keys(DEFAULT_ESPP_INPUTS_STATE), parsedQuery);
      const parsedStateFromQuery = R.evolve(ESPP_INPUT_URL_PARSE_EVOLVERS, overlappingInputs);
      esppProfitsModelInputsStateManager.syncUpdate(parsedStateFromQuery);
      return <Redirect to='/espp' />;
    }

    return (
      <HomeTemplate
        mainComponent={
          <ESPPDetailsCollector
            doneCollectingData={() => {
              // scroll to top
              window.scrollTo(0, 0);
              this.setState({ doneCollectingData: true });
              this.props.history.push('/espp/results');
            }}
          />
        }
        footer={this.renderFooter()}
      />
    );
  }
}

export class HomeResults extends Component {
  renderFooter() {
    return (
      <Fragment>
        <p className='footer-header-text'>Did you want to talk with a Cake Financials analyst?</p>
        <p>
          {'You can '}
          <a
            className='calendly-link'
            href='https://calendly.com/cakeanalyst'
            rel='noopener noreferrer'
            target='_blank'
          >
            set up a free 15 minute consultation
          </a>
          {' with one of our analysts or check out more details on the '}
          <a className='cake-homepage-link' href='https://cakefinancials.com' rel='noopener noreferrer' target='_blank'>
            Cake Financials website
          </a>
          .
        </p>
      </Fragment>
    );
  }

  render() {
    return <HomeTemplate mainComponent={<ESPPProfitsDisplay />} footer={this.renderFooter()} />;
  }
}
