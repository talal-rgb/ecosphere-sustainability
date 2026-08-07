const base = require('./tailwind.config.js');

module.exports = {
  ...base,
  content: [
    './platform/**/*.html',
    './components/**/*.html',
  ],
};
