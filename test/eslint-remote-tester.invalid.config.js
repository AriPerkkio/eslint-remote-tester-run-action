import base from './eslint-remote-tester.config.js';

export default {
    ...base,

    // Expected to throw "Missing repositories" when validated
    repositories: [],
};
