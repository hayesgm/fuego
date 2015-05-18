
App.Router.reopen({
  rootURL: '/🔥'
});

App.Router.map(function() {
  this.resource('pools', {path: '/'});
  this.resource('pool', {path: '/:pool_id'});
});
