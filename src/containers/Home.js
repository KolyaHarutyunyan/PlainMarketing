import React, { Component } from 'react';
import { ESPPDetailsCollector } from '../espp_profits/espp_details_collector';
import axios from 'axios';
import returnCalculator from '../lib/return_calculator';

export default class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: false,
            loading: true,
        };
    }

    async componentDidMount() {
        const response2 = await axios.get('https://api.iextrading.com/1.0/stock/INTU/chart/5y');
        console.log(returnCalculator.calculateESPPEarnings({
            stockData: response2.data,
            periodStartDate: '2017-01-01',
            periodCadenceInMonths: 3,
            income: 100000,
            lookback: true,
            discount: .15,
            contributionPercentage: .15
        }));
    }

    render() {
        return (
            <div className='home-container'>
                <div className='lander'>
                    <ESPPDetailsCollector />
                </div>
            </div>
        );
    }
}
