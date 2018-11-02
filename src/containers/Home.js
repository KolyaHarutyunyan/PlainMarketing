import React, { Component, Fragment } from 'react';
import { Button, Col, Row } from 'antd';
import { ESPPDetailsCollector } from '../espp_profits/espp_details_collector';
import { ESPPProfitsDisplay } from '../espp_profits/espp_profits_display';
import { MethodologyExpander } from '../espp_profits/methodology_expander';

import './Home.css';

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = { doneCollectingData: false };
  }

  renderESPPDetailsCollectorPageFooter() {
    return (
      <Fragment>
        <p className='what-is-cake-fin'>What is Cake Financials?</p>
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
            <Fragment>
              <Row>
                <Button
                  onClick={() => {
                    this.setState({ doneCollectingData: false });
                  }}
                >
                  Edit Data
                </Button>
              </Row>
              <Row>
                <ESPPProfitsDisplay />
              </Row>
            </Fragment>
          ) : (
            <ESPPDetailsCollector doneCollectingData={() => this.setState({ doneCollectingData: true })} />
          )}
          <MethodologyExpander />
        </div>
        <Row className='espp-calculator-footer' type='flex' justify='center'>
          <Col span={10}>
            <Row type='flex' justify='center'>
              <Col className='espp-standalone-logo-container' />
            </Row>
            <Row type='flex' justify='center'>
              {this.state.doneCollectingData ? null : this.renderESPPDetailsCollectorPageFooter()}
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}
