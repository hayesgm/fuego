let Pool = Backbone.Model.extend({
  
  defaults:{
    pool_id: '123',
    chunks: [1,2,3],
    description: 'Cool'
  },
  
  initialize: function() {
    console.log('New pool created...');
  }
 
});

export default Pool;