import React, { Component } from 'react';
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
                        <ESPPProfitsDisplay />
                        :
                        <ESPPDetailsCollector
                            doneCollectingData={() => this.setState({ doneCollectingData: true })}
                        />
                    }
                </div>
            </div>
        );
    }
}
