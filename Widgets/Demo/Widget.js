define(['dojo/_base/declare', 'jimu/BaseWidget', 'dojo/_base/lang', 'dojo/on', 'esri/geometry/webMercatorUtils'],
function(declare, BaseWidget, lang, on, webMercatorUtils) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
	 this.own(on(this.map, 'extent-change', lang.hitch(this, function(){
		  var Point = webMercatorUtils.xyToLngLat(this.map.extent.getCenter().x, this.map.extent.getCenter().y)
              this.results.innerHTML =
                "Level: " + this.map.getLevel() + "<br>" +
                "xmin : " + this.map.extent.xmin + "<br>" +
                "ymin : " + this.map.extent.ymin + "<br>" +
                "xmax : " + this.map.extent.xmax + "<br>" +
                "ymax : " + this.map.extent.ymax + "<br>" + "<br>"
              this.center.innerHTML = 
				"center: " + Point + "<br>"
	  })));
	  
      console.log('postCreate');
	  
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
		  var Point = webMercatorUtils.xyToLngLat(this.map.extent.getCenter().x, this.map.extent.getCenter().y)
              this.results.innerHTML =
                "Level: " + this.map.getLevel() + "<br>" +
                "xmin : " + this.map.extent.xmin + "<br>" +
                "ymin : " + this.map.extent.ymin + "<br>" +
                "xmax : " + this.map.extent.xmax + "<br>" +
                "ymax : " + this.map.extent.ymax + "<br>"  + "<br>"
              this.center.innerHTML = 
				"center: " + Point + "<br>"
      
	  //console.log(this.map);
    },
	
    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});