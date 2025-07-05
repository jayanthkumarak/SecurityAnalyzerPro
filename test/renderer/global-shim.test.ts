import 'fake-indexeddb/auto'; // jest-dom polyfill
it('exposes global in browser context', () => {
  expect((window as any).global).toBe(window);
}); 