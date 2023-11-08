module.exports = {
    root: true,
    env: {
        browser: true,
        amd: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    extends: ['eslint:recommended', 'google'],
    rules: {
        quotes: ['error', 'single'],
        indent: ['error', 4],
    },
};
