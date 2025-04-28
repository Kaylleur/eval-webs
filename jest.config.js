// jest.config.js
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js', '<rootDir>/src/tests/cleanup.js'],
    testMatch: [
        '**/?(*.)+(spec|test).[tj]s?(x)'
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/src/**/*.js'
    ],
    // Si vous souhaitez ignorer certains dossiers:
    "testPathIgnorePatterns": ["/node_modules/", "/dist/"],
    "maxWorkers":1
};

