class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }
  setState(update) {
    this.state = { ...this.state, ...update };
  }
  render() {
    return null;
  }
}

const React = {
  Component,
  createElement: (type, props, ...children) => ({ type, props, children }),
  forwardRef: (fn) => fn,
  useState: (init) => [init, () => {}],
  useEffect: () => {},
  useRef: (init) => ({ current: init }),
  useContext: () => ({}),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  useId: () => 'mock-id',
  useDeferredValue: (v) => v,
  useTransition: () => [false, (fn) => fn()],
  useInsertionEffect: () => {},
};

module.exports = React;
module.exports.default = React;
module.exports.Component = Component;
