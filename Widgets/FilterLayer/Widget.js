define(['dojo/_base/declare', 'esri/layers/FeatureLayer', 'dojo/_base/array', 'esri/graphicsUtils', 'esri/tasks/query', 'dojo/_base/lang', 'dojo/on', 'dijit/form/CheckBox', 'dijit/form/Select','jimu/BaseWidget', 'dijit/_WidgetsInTemplateMixin'],
function(declare, FeatureLayer, array, graphicsUtils, Query, lang, on, CheckBox, Select, BaseWidget, _WidgetsInTemplateMixin) {
  //To create a widget, you need to derive from BaseWidget.
  var clazz = declare([BaseWidget,  _WidgetsInTemplateMixin], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-filter',
	qLocale: "ROUTE_NAME is not null",
	qStage: "Stage is not null",
	qRoute: "Route is not null",
	altAssessments: null,
	dtipService: null,
	routesLayer: null,
	altTaskLayer: null,

    postCreate: function() {
      this.inherited(arguments);
	  this.own(on(this.selectArea, 'change', lang.hitch(this, this._Onchange)));
	  this.own(on(this.selectStage, 'change', lang.hitch(this, this._Onchange)));
	  
	  this.altAssessments = this.map.itemInfo.itemData.operationalLayers[1].layerObject
	  this.dtipService = this.map.itemInfo.itemData.operationalLayers[0]
	  
	  //var altTaskURL = this.dtipService.layerObject.url + "/0"
	  var routesURL = this.dtipService.layerObject.url + "/2"
	  //this.altTaskLayer = new FeatureLayer(altTaskURL);
	  this.routesLayer = new FeatureLayer(routesURL);
	  

    },

    startup: function() {
      this.inherited(arguments);
      var query = new Query();
      var locale = this.selectArea;
	  var task = this.selectTask;
	  console.log(this.altAssessments)
     
      query.where = "1=1";
      query.returnGeometry = false;
      query.returnDistinctValues = true;
	  query.orderByFields = ['ROUTE_NAME'];
      query.outFields = ['ROUTE_NAME'];
        this.routesLayer.queryFeatures(query, function(result) {
          locale.removeOption(locale.getOptions());
          array.forEach(result.features, function(feature){
            locale.addOption({ value: "ROUTE_NAME LIKE '%" + feature.attributes.ROUTE_NAME + "%'", label: feature.attributes.ROUTE_NAME})
          }, this);
        }, this);
        query.outFields = ['TASK_TYPE'];
		query.orderByFields = ['TASK_TYPE'];
          this.altAssessments.queryFeatures(query, function(result) {
            task.removeOption(task.getOptions());
            array.forEach(result.features, function(feature){
              task.addOption({ value: "TASK_TYPE = '" + feature.attributes.TASK_TYPE + "'", label: feature.attributes.TASK_TYPE})
            }, this);
          }, this);
    },
    _Onchange: function(){

      var query = new Query();
      var routes = this.selectRoute;
      this.qStage = this.selectStage.get("value");
	
      query.where = this.qStage.toString() + " AND " + this.selectArea.get("value").toString();
      query.returnGeometry = false;
      query.returnDistinctValues = true;
	  query.orderByFields = ['Route'];
      query.outFields = ['Route'];
        this.routesLayer.queryFeatures(query, function(result) {
          routes.removeOption(routes.getOptions());
          array.forEach(result.features, function(feature){
            routes.addOption({ value: "Route ='" + feature.attributes.Route + "'", label: feature.attributes.Route})
          }, this);
        }, this);

    },
    _filterAltTasks: function(){
   	  	
		var filterExpression = this.selectTask.get("value").toString();
		this.altAssessments.setDefinitionExpression(filterExpression)
		this.altAssessments.show()

    },
	_altTasksOff: function(){
		this.altAssessments.hide()
	}, 
   
    _applyFilter: function(){

     	  var filterExpression = this.qStage.toString() + " AND " + this.selectArea.get("value").toString() + " AND " + this.selectRoute.get("value").toString();
    
          var layerDefinitions = [];
          layerDefinitions[0] = filterExpression;
          layerDefinitions[2] = filterExpression;
          this.dtipService.layerObject.setLayerDefinitions(layerDefinitions)

          var query = new Query();
          var map = this.map
          query.where = filterExpression
          this.routesLayer.queryFeatures(query, function(featureSet){
           
			  map.setExtent(graphicsUtils.graphicsExtent(featureSet.features).expand(2));

         }, this);

    },
	_clearFilter: function(){
		
		this.dtipService.layerObject.setDefaultLayerDefinitions()
	},
    onOpen: function(){
      //console.log('onOpen');
    },
    onClose: function(){
      //console.log('onClose');
    },

    onMinimize: function(){
      //console.log('onMinimize');
    },

    onMaximize: function(){
      //console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      //console.log('onSignIn');
    },

    onSignOut: function(){
      //console.log('onSignOut');
    }
  });
  return clazz
});
