import React, { Component, Fragment } from 'react';
import axios from 'axios';

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
            const response = await axios.get(`https://s3.amazonaws.com/cake-financials-zapier-dump/company_data/${this.state.company}.json`);
            this.setState({ loading: false, data: response.data });
        } catch (err) {
            this.setState({ loading: false, error: true });
        }
    }

    render() {
        return (
            <div className='Home'>
                <div className='lander'>
                    <h1>Company!!!</h1>
                    {
                        this.state.loading ? (
                            <p>LOADING {this.state.company}...</p>
                        ) : (
                            <Fragment>
                                <p>LOADED {this.state.company}</p>
                                <p>{JSON.stringify(this.state.data)}</p>
                            </Fragment>
                        )
                    }
                </div>
            </div>
        );
    }
}