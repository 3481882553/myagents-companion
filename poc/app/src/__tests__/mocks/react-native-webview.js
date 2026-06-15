const React = require('react');

module.exports = {
  WebView: React.forwardRef((props, ref) =>
    React.createElement('WebView', { ...props, ref })
  ),
};
