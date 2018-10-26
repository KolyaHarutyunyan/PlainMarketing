import * as R from 'ramda';
import React, { Component } from 'react';

const createSimpleStateManager = () => {
    const notifyFns = [];
    let notifiedCalledAtLeastOnce = false;
    let lastNotification = {
        data: null,
        error: null,
        loading: false,
    };

    const subscribe = (notifyFn) => {
        notifyFns.push(notifyFn);

        if (notifiedCalledAtLeastOnce) {
            notifyFn(lastNotification);
        }

        const unsubscribe = () => {
            const indexOfNotifyFn = notifyFns.indexOf(notifyFn);

            if (~indexOfNotifyFn) {
                notifyFns.splice(indexOfNotifyFn, 1);
            }
        };

        return unsubscribe;
    };

    const notify = (notification) => {
        notifiedCalledAtLeastOnce = true;
        lastNotification = notification;
        notifyFns.forEach(notifyFn => notifyFn(notification));
    };

    /*
    TODO: queue updates?
    */
    const asyncUpdate = async (fn) => {
        notify(R.merge(lastNotification, { loading: true, error: null }));

        try {
            const updatedData = R.merge(lastNotification.data || {}, await fn());
            notify(R.merge(lastNotification, { loading: false, error: null, data: updatedData }));
        } catch (error) {
            notify(R.merge(lastNotification, { loading: false, error }));
        }
    };

    const syncUpdate = (data) => {
        try {
            const updatedData = R.merge(lastNotification.data || {}, data);
            notify(R.merge(lastNotification, { loading: false, error: null, data: updatedData }));
        } catch (error) {
            notify(R.merge(lastNotification, { loading: false, error }));
        }
    };

    return {
        asyncUpdate,
        getCurrentState: () => lastNotification,
        syncUpdate,
        subscribe,
    };
};

const STATE_MANAGERS_CACHE = {};

const withStateManagers = ({ WrappedComponent, stateManagerNames }) => {
    const STATE_MANAGERS = R.map(
        (name) => ( { name, manager: getStateManager({ name }) } ),
        stateManagerNames
    );

    // ...and returns another component...
    const WrappedWithStateManagers = class extends Component {
        constructor(props) {
            super(props);

            this.state = R.reduce(
                (state, { name, manager }) => R.merge(
                    state,
                    { [name]: manager.getCurrentState(), }
                ),
                {},
                STATE_MANAGERS
            );

            this.UNSUB_FUNCTIONS = [];
        }

        componentDidMount() {
            // ... that takes care of the subscription...
            R.forEach(
                ({ name, manager }) => {
                    this.UNSUB_FUNCTIONS.push(manager.subscribe(stateData => {
                        this.setState({ [name]: stateData });
                    }));
                },
                STATE_MANAGERS
            );
        }

        componentWillUnmount() {
            R.forEach(
                (unsubFn) => unsubFn(),
                this.UNSUB_FUNCTIONS
            );
        }

        render() {
            // ... and renders the wrapped component with the fresh data!
            // Notice that we pass through any additional props
            return <WrappedComponent
                stateManagers={
                    R.fromPairs(
                        R.map(
                            ({ name, manager }) => {
                                return [ name, { manager, state: this.state[name] } ];
                            },
                            STATE_MANAGERS
                        )
                    )
                }
                {...this.props}
            />;
        }
    };

    return WrappedWithStateManagers;
};

const STATE_MANAGER_NAMES = {
    COMPANY_INFO: 'companyInfo',
    ESPP_PROFITS_MODEL_INPUTS: 'esppProfitsModelInputs',
};

const getStateManager = ({ name }) => {
    if (!STATE_MANAGERS_CACHE[name]) {
        STATE_MANAGERS_CACHE[name] = createSimpleStateManager();
    }

    return STATE_MANAGERS_CACHE[name];
};

export {
    getStateManager,
    STATE_MANAGER_NAMES,
    withStateManagers,
};