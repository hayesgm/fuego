jest.dontMock('services/helpers');

describe('helpers', () => {
  var helpers = require('services/helpers');

  describe('guid', () => {
    it('generates a semi-random guid', () => {
      expect(helpers.guid()).toMatch(/[\dABCDEF-]+/);
    });
  });

  describe('diff', () => {
    it('diffs two arrays', () => {
      expect(helpers.diff([1,2,3],[2])).toEqual([1,3]);
    });
  });

  describe('#assert', () => {
    it('does nothing when assertion is true', () => {
      expect(() => { helpers.assert(true) }).not.toThrow();
    });

    it('raises error when assertion is false', () => {
      expect(() => { helpers.assert(false) }).toThrow();
    });
  });

});