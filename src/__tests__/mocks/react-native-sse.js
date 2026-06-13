class MockEventSource {
  static instances = [];
  onopen = null;
  onerror = null;
  onmessage = null;
  readyState = 0;
  close = jest.fn();

  constructor(url, options) {
    this.url = url;
    this.options = options;
    MockEventSource.instances.push(this);
  }

  addEventListener(type, callback) {
    if (type === 'open') this.onopen = callback;
    if (type === 'error') this.onerror = callback;
    if (type === 'message') this.onmessage = callback;
  }

  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }

  simulateError() {
    if (this.onerror) this.onerror();
  }

  simulateMessage(data) {
    if (this.onmessage) this.onmessage({ data });
  }

  static reset() {
    MockEventSource.instances = [];
  }

  static latest() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

module.exports = {
  default: MockEventSource,
  MockEventSource,
};
