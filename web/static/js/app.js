
import Pool from './models/pool';

var biggie = new Pool({ pool_id: 123, description: 'Notorious BIG', chunks: [] });
var jones = new Pool({ pool_id: 456, description: 'Cool and the Gang', chunks: [] });

var Pools = Backbone.Collection.extend({
    model: Pool,
 
    initialize: function() {
        console.log('New collection initialized...');
    }
});  
 
var pools = new Pools([biggie, jones]);  

var PoolListView = Backbone.View.extend({
  el: '#navigation',
 
  initialize:function(){
    this.render();
  },

  render: function () {
    var source = $('#navigation-template').html();
    var template = Handlebars.compile(source);
    var html = template(pools.toJSON());
    this.$el.html(html);
  }
});

var poolListView = new PoolListView();

var Workspace = Backbone.Router.extend({
  routes: {
    "":         "index",
    ":pool_id": "show"
  },

  index: function() {
    console.log(["index pool"]);
  },

  show: function(pool_id) {
    console.log(["showing pool", pool]);
  }
});

Backbone.history.start({root: "/🔥"});