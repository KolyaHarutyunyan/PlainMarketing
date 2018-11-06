import React, { Component, Fragment } from 'react';
import { Col, Row } from 'antd';
import { ESPPDetailsCollector } from '../espp_profits/espp_details_collector';
import { ESPPProfitsDisplay } from '../espp_profits/espp_profits_display';
import { MethodologyExpander } from '../espp_profits/methodology_expander';

import './Home.css';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = { doneCollectingData: false };
  }

  renderESPPProfitsPageFooter() {
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

  renderESPPDetailsCollectorPageFooter() {
    return (
      <Fragment>
        <p className='footer-header-text'>What is Cake Financials?</p>
        <p>
          What is Cake Financials? Cake gives you interest-free money to invest in your Employee Stock Purchase Plan and
          manages your account to maximize annual returns. Cake is completely free. If profits are made, we split them.
          It is about time that you have your cake and eat it too!
        </p>
      </Fragment>
    );
  }

  render() {
    return (
      <div className='home-container'>
        <div className='lander'>
          <Row className='espp-header-container'>
            <div className='cake-logo-with-words-container' />
            <p>
              Employee Stock Purchase Plan <br /> (ESPP) Calculator
            </p>
          </Row>
          {this.state.doneCollectingData ? (
            <ESPPProfitsDisplay goBack={() => this.setState({ doneCollectingData: false })} />
          ) : (
            <ESPPDetailsCollector
              doneCollectingData={() => {
                // scroll to top
                window.scrollTo(0, 0);
                this.setState({ doneCollectingData: true });
              }}
            />
          )}
          <MethodologyExpander />
        </div>
        <Row className='espp-calculator-footer' type='flex' justify='center'>
          <Col xs={22} sm={16}>
            <Row type='flex' justify='center'>
              <Col className='espp-standalone-logo-container' />
            </Row>
            <Row type='flex' justify='center'>
              {this.state.doneCollectingData
                ? this.renderESPPProfitsPageFooter()
                : this.renderESPPDetailsCollectorPageFooter()}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}
