jest.dontMock('services/logging');

describe('logging', () => {
  describe('with env = dev', function() {
    var env = require('env');

    beforeEach(() => {
      env.env = { dev: true, prod: false };
    });

    it('should store logs', () => {
      var logging = require('services/logging')

      logging.trace('tr');
      logging.debug('de');

      expect(logging.logs()).toEqual([['tr']]);
    });
  });

  describe('with env = prod', function() {
    var env = require('env');

    beforeEach(() => {
      env.env = { dev: false, prod: true };
    });

    it('should store logs', () => {
      var logging = require('services/logging')

      logging.trace('tr');
      logging.debug('de');

      expect(logging.logs()).toEqual([['tr']]);
    });
  });
});