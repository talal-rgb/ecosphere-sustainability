const base = require('./tailwind.config.js');

module.exports = {
  ...base,
  content: [
    './index.html',
    './components/**/*.html',
  ],
};
