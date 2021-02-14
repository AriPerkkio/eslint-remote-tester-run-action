module.exports = {
    ...require('./eslint-remote-tester.config.js'),

    onComplete: async function onComplete() {
        console.log('onComplete');
    },
};
