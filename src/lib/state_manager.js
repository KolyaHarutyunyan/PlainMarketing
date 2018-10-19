import * as R from 'ramda';

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

export const STATE_MANAGERS = {
    COMPANY_INFO: createSimpleStateManager(),
    ESPP_PROFITS_MODEL_INPUTS: createSimpleStateManager(),
    STOCK_DATA: createSimpleStateManager(),
};