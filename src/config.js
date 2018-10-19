const URL_STAGES = {
    production: 'https://g2cx8m6l2b.execute-api.us-east-2.amazonaws.com/prod',
    development: 'https://nx253m7fba.execute-api.us-east-2.amazonaws.com/dev',
};

const REACT_APP_BUILD_ENV = process.env.REACT_APP_BUILD_ENV || process.env.NODE_ENV;

const URL = URL_STAGES[REACT_APP_BUILD_ENV];
const proxyZapierWebhookURL = `${URL}/proxy/zapier`;

export default {
    apiGateway: {
        REGION: 'us-east-2',
        URL,
        proxyZapierWebhookURL
    },
};
