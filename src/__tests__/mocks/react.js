const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  forwardRef: (fn) => fn,
  useState: (init) => [init, () => {}],
  useEffect: () => {},
  useRef: (init) => ({ current: init }),
  useContext: () => ({}),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
};

module.exports = React;
module.exports.default = React;
