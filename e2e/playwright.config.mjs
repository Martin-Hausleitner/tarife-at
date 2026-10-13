export default { testDir: './tests', timeout: 240000, workers: 1, reporter: [['list'], ['json', { outputFile: 'results.json' }]], use: { channel: 'chrome', locale: 'de-AT' } };
