define(['dojo/_base/declare',
  'dojo/_base/array',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin'
],
function(declare, array, BaseWidget, _WidgetsInTemplateMixin) {
  var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
    templateString: '<div class="jimu-btn" data-dojo-attach-point="exeNode" data-dojo-attach-event="click:_refreshLayers">Refresh</div>',

    _refreshLayers: function(){

      this.map.infoWindow.hide()
      var opLayers = this.map.itemInfo.itemData.operationalLayers
      array.forEach(opLayers, function(opLayer) {
        if(opLayer.layerType = 'ArcGISFeatureLayer') {
          opLayer.layerObject.refresh()
          //alert("refreshed Layer: " + opLayer.title)
        }
      }, this);
    }
  });
  return clazz;
});