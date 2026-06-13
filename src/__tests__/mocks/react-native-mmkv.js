const store = new Map();

module.exports = {
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn((key) => store.get(key)),
    set: jest.fn((key, value) => store.set(key, value)),
    delete: jest.fn((key) => store.delete(key)),
  })),
};
