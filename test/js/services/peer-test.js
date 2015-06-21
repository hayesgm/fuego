jest.dontMock('services/peer');

describe('peer', () => {
  var peer = require('services/peer');

  beforeEach(() => {
    window.Peer = jest.genMockFunction();
    window.Peer.mockReturnValue({on: jest.genMockFunction()});
  });

  describe('#init', () => {
    it('should create a new Peer', () => {
      peer.init();
    });
  });

  describe('#peer', () => {
    xit('test', () => {});
  });

  describe('#seed', () => {
    xit('test', () => {});
  });

  describe('#release', () => {
    xit('test', () => {});
  });

  describe('#peer_id', () => {
    xit('test', () => {});
  });

  describe('#getRemote', () => {
    xit('test', () => {});
  });

  describe('#connectRemote', () => {
    xit('test', () => {});
  });

  describe('#resumeSeeds', () => {
    xit('test', () => {});
  });

  describe('#getActiveUploads', () => {
    xit('test', () => {});
  });
});