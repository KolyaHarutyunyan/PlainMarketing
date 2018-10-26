import React, { Component, Fragment } from 'react';
import { Button, Row } from 'antd';
import { ESPPDetailsCollector } from '../espp_profits/espp_details_collector';
import { ESPPProfitsDisplay } from '../espp_profits/espp_profits_display';

export default class Home extends Component {
    constructor(props) {
        super(props);

        this.state = { doneCollectingData: false };
    }

    render() {
        return (
            <div className='home-container'>
                <div className='lander'>
                    { this.state.doneCollectingData ?
                        <Fragment>
                            <Row>
                                <Button onClick={() => {
                                    this.setState({ doneCollectingData: false });
                                }}>
                                    Edit Data
                                </Button>
                            </Row>
                            <Row>
                                <ESPPProfitsDisplay />
                            </Row>
                        </Fragment> :
                        <ESPPDetailsCollector
                            doneCollectingData={() => this.setState({ doneCollectingData: true })}
                        />
                    }
                </div>
            </div>
        );
    }
}
