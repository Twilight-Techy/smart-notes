const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the default config from Expo
const config = getDefaultConfig(__dirname);

// Add SQL extension support for Drizzle migrations
config.resolver.sourceExts.push('sql');

// Export with NativeWind wrapper, using safe absolute path for Windows
module.exports = withNativeWind(config, {
    input: path.resolve(__dirname, 'global.css'),
    inlineRems: true
});
