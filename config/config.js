const _ = require('lodash');
const config = require('./config.json');
const defaultConfig = config.development
const environment = 'development';
const environmentConfig = config[environment]
const finalConfig = _.merge(defaultConfig,environmentConfig)
global.gConfig = finalConfig;
