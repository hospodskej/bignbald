// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The API server lives in ./server with its own node_modules; keep it out of the app bundle.
config.resolver.blockList = [/\/server\/.*/];

module.exports = config;
