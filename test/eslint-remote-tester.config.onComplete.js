import base from './eslint-remote-tester.config.js';

export default {
    ...base,

    onComplete: async function onComplete() {
        console.log('onComplete');
    },
};
