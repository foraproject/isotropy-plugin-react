var getbabelRelayPlugin = require('babel-relay-plugin');
var schema = require('../test/my-schema.json');

module.exports = getbabelRelayPlugin(schema.data);
