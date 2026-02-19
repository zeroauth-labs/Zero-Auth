module.exports = function (api) {
    api.cache(false);
    return {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
        plugins: ['react-native-reanimated/plugin'],
    };
};
