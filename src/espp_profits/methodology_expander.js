import React, { Component, Fragment } from 'react';
import { Col, Icon, Row } from 'antd';

import config from '../config';

import './methodology_expander.css';

const {
  stateManager: { container: stateManagerContainer, STATE_MANAGER_NAMES },
} = config;

export const MethodologyExpander = stateManagerContainer.withStateManagers({
  stateManagerNames: [ STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS, STATE_MANAGER_NAMES.STOCK_DATA ],
  WrappedComponent: class MethodologyExpander extends Component {
    constructor(props) {
      super(props);

      this.esppProfitsModelInputsStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.ESPP_PROFITS_MODEL_INPUTS];
      this.stockDataStateManager = this.props.stateManagers[STATE_MANAGER_NAMES.STOCK_DATA];

      this.state = {
        expanded: false,
      };
    }

    renderMethodology() {
      /*
      CHECK IF returnsData is null, if not then can render specific methodology info
      const esppProfitsData = this.esppProfitsModelInputsStateManager.getData();
      const returnsData = this.stockDataStateManager.getData();

      console.log({
        esppProfitsData,
        returnsData,
      });
      */

      return (
        <Row className='methodology-card-container'>
          <Col className='text-container' sm={{ span: 20, offset: 2 }}>
            <p>
              This tool gives users a rough estimate of their potential earnings, in many cases there are extenuating
              circumstances that may result in the actual gains being different than what the tool predicted. We did not
              build this tool to be used as investment advice or financial planning, it is merely for education and
              because we were woefully disappointed with the available articles and calculators that the internet had to
              offer around ESPP education.
            </p>
            <p>
              For all of our calculations we assume that the stock was immediately sold at the first available
              opportunity.
            </p>
            <p>
              The simplest ESPP calculation is done by multiplying your annual income (I) by the max contribution
              percentage (P) by the total discount (D) and then dividing the profits by 2 to represent the subtraction
              of Cake’s share of the profits. Where D = (dE: max ESPP discount) + (dL: discount from lookback, explained
              below).
            </p>
            <p>This calculation looks like: (I*P*(dE+dL))/2.</p>
            <p>
              If your ESPP program has a lookback provision it makes this calculation much more interesting, as you get
              to buy the stock at a discount below the LOWEST price between the stock price at the beginning of the
              purchase period and the last day. Let’s say your stock went up 10% in a purchase period, this means that
              you are effectively buying it at a discount of 25% (10% for lookback +15% for discount)
            </p>
            <p>
              These lookback gains are combined with your ESPP fixed discount gains to give us the total gains for each
              purchase period. Adding up the gains from each time period and removing Cake’s portion gives us the yearly
              gain outputted from the tool.
            </p>

            <p>
              Final note: we built this tool so that a person could perform calculations using the stock price of any
              publicly traded company on the US stock exchange. This does not mean that a given company has an ESPP in
              place. However, you can always use this tool as a way to convince your finance department that this would
              be a great employee perk!
            </p>
            <p>
              <strong>
                {'Have any questions about this analysis? '}
                <a target='_blank' rel='noopener noreferrer' href='https://calendly.com/cakeanalyst'>
                  Schedule a free 15 minute consultation
                </a>
                {' with a Cake Analyst.'}
              </strong>
            </p>
          </Col>
        </Row>
      );
    }

    render() {
      return (
        <Fragment>
          <Row className='methodology-expander-container' type='flex' justify='center' align='middle'>
            <Col span={18}>
              <div className='text-container' onClick={() => this.setState({ expanded: !this.state.expanded })}>
                <span>Expand to See the Methodology</span>
                <Icon type={this.state.expanded ? 'caret-down' : 'caret-right'} />
              </div>
            </Col>
          </Row>
          {this.state.expanded ? this.renderMethodology() : null}
        </Fragment>
      );
    }
  },
});
