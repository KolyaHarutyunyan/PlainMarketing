import React, { Component, Fragment } from 'react';
import axios from 'axios';
import returnCalculator from '../lib/return_calculator';

export default class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            company: props.match.params.company,
            error: false,
            loading: true,
        };
    }

    async componentDidMount() {
        try {
            const response = await axios.get('https://api.iextrading.com/1.0/ref-data/symbols');
            console.log(response.data);

            const response2 = await axios.get('https://api.iextrading.com/1.0/stock/AAPL/chart/5y');
            console.log(response2.data);
            console.log(returnCalculator.getDataForDates({
                stockData: response2.data,
                periodStartDate: '2017-01-01',
                periodCadenceInMonths: 3,
            }));
            this.setState({ loading: false, data: response.data });
        } catch (err) {
            this.setState({ loading: false, error: true });
        }
    }

    render() {
        return (
            <div className='home-container'>
                <div className='lander'>
                    <h1>Home!!!</h1>
                </div>
            </div>
        );
    }
}