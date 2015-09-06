define([
  './lib/Chart',
  'esri/request',
  'esri/graphic',
  'esri/geometry/Polyline',
  'esri/geometry/Polygon',
  'esri/symbols/TextSymbol',
  'esri/graphicsUtils',

  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleMarkerSymbol',

  'esri/renderers/SimpleRenderer',
  'esri/renderers/UniqueValueRenderer',
  'esri/renderers/Renderer',

  'esri/InfoTemplate',
  'esri/dijit/PopupTemplate',
  'esri/layers/FeatureLayer',

  'esri/tasks/FeatureSet',
  'esri/tasks/Geoprocessor',
  'esri/tasks/GeometryService',

  'dojo/on',
  'dojo/dom-construct',
  'dojo/dom-attr',
  'dojo/query',
  'dojo/Deferred',

  'dojo/_base/lang',
  'dojo/_base/declare',
  'dojo/_base/html',
  'dojo/_base/Color',
  'dojo/_base/array',

  'dojo/dom',
  'dojo/dom-class',

  'dijit/form/Select',

  'dijit/_WidgetsInTemplateMixin',

  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  'jimu/dijit/LoadingIndicator',
  'jimu/dijit/DrawBox'
],
  function (Chart, esriRequest, Graphic, Polyline, Polygon, TextSymbol, graphicsUtils,
    SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol,
    SimpleRenderer, UniqueValueRenderer, Renderer,
    InfoTemplate, PopupTemplate, FeatureLayer,
    FeatureSet, Geoprocessor, GeometryService,
    on, domConstruct, domAttr, query, Deferred,
    lang, declare, html, Color, array,
    dom, domClass,
    Select,
    _WidgetsInTemplateMixin,
    BaseWidget, TabContainer, LoadingIndicator,
    DrawBox) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      // DemoWidget code goes here

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,
      name: 'LandAnalysis',
      baseClass: 'jimu-widget-landAnalysis',
      renderer: {},
      resultLayer: null,
      layerSelection: "Landcover",
      fieldSelection: "Name_2012",

      postCreate: function () {
        this.inherited(arguments);
        this.drawBox.setMap(this.map);
        this._bindEvents();
        
      },
      startup: function () {
        this.inherited(arguments);
        //add gp link to popup
        if (this.config.isPopupExecute) {
          var link = domConstruct.create("a", {
            "class": "action",
            "id": "statsLink",
            "innerHTML": "Land Analysis", //text that appears in the popup for the link
            "href": "javascript: void(0);"
          }, query(".actionList", this.map.infoWindow.domNode)[0]);
	  
          //when the link is clicked run analysis
          this.own(on(link, 'click', lang.hitch(this, this.runAnalysis)));
        }
      
        
        //set default renderer
        var renderer = this.config.model.renUrl + "1";
        this._getRenderer(renderer);
        //set panel UI
        this.tab = new TabContainer({
          tabs: [{
            title: this.nls.input,
            content: this.inputPaneNode
          }, {
              title: this.nls.output,
              content: this.outputPaneNode
            }],
          selected: this.nls.input
        });
        this.tab.placeAt(this.domNode);
        this.tab.startup();
        //construct load node
        this.loading = new LoadingIndicator({
          hidden: true
        }, this.loadingNode);
        this.loading.startup();
      },

      runAnalysis: function (evt) {
        this.inherited(arguments);
        //this.map.graphics.clear();
        //display a message so user knows something is happening
        //domAttr.set(dom.byId("statsLink"), "innerHTML", "Calculating...");

        //Get the feature associated with the displayed popup and use it as
        //input to the geoprocessing task. The geoprocessing task will calculate
        //land cover statistics for the area selected.

        var feature = this.map.infoWindow.getSelectedFeature();
        var geo = feature.geometry;
        var att = feature.attributes;
        var sym = new SimpleFillSymbol().setColor(new Color([0, 255, 255, 0.25]));

        var graphic = new Graphic(geo, sym, att);

        //create featureSet from selection
        var featureSet = new FeatureSet();
        featureSet.geometryType = "esriGeometryPolygon";
        featureSet.features = [graphic];

        var inputField = this.selectField.get("value")
        //set gp parameters
        var taskParams = {
          "Field": inputField,
          "Feature_Set": featureSet
        };
        //run analysis
        //console.log(taskParams)
        this.executeGP(taskParams);
      },

      executeGP: function (taskParams) {
        //clear last result
        this._clearLastResult();
        //reset link name
        //domAttr.set(dom.byId("statsLink"), "innerHTML", "Calculate Land Cover");
        //construct gp
        console.log(this.config.model.gpUrl)
        this.gp = new Geoprocessor(this.config.model.gpUrl);
        this.gp.setOutSpatialReference(this.map.spatialReference);
        //fires when a synchronous GP task is completed
        this.own(on(this.gp, 'execute-complete', lang.hitch(this, this.onExecuteComplete)));
        //fires on error
        this.own(on(this.gp, 'error', lang.hitch(this, this.onError)));

        //switch to display output tab
        this.tab.selectTab(this.nls.output);
        //show busy
        this._showLoading();

        html.addClass(this.exeNode, 'jimu-state-disabled');

        //check gp synchronous or asynchronous
        if (this.config.model.isSynchronous) {
          this.gp.execute(taskParams);
        } else {
          alert("Under Construction")
          //this.gp.submitJob(inputValues);
        }

      },

      onExecuteComplete: function (results) {

        this._hideLoading();
        //the results.results is an array of ParameterValue,
        //because it contains one or more parameters
        this._processResults(results.results);
        html.removeClass(this.exeNode, 'jimu-state-disabled');
      },

      onJobComplete: function (jobInfo) {

      },

      onJobCancel: function () {

      },

      onStatusUpdate: function (jobInfo) {

      },

      onError: function (error) {
        this.loading.hide();
        this.infoTextNode.innerHTML = error.error.message;

        html.removeClass(this.exeNode, 'jimu-state-disabled');

        this.jobId = '';
      },

      destroy: function () {
        //this._clearLastInput();
        this._clearLastResult();
        this.inherited(arguments);
      },

      _showLoading: function (text) {
        this.loading.show();
        html.setStyle(this.infoNode, 'display', 'block');
        this.infoTextNode.innerHTML = text ? text : this.nls.executing;
      },

      _hideLoading: function () {
        html.setStyle(this.infoNode, 'display', 'none');
        this.loading.hide();
      },

      _createErrorMessages: function (messages) {
        this.infoTextNode.innerHTML = '';

        var ulNode = html.create('ul', {
          'class': 'output-node'
        }, this.outputSectionNode);

        this.resultNodes.push(ulNode);

        array.forEach(messages, lang.hitch(this, function (msg) {
          html.create('li', {
            'class': 'error-message',
            innerHTML: msg.description
          }, ulNode);
        }));
      },

      _processResults: function (values) {
        var selField = this.selectField.get("value")
        //define template for result popup
        var template = new PopupTemplate({
          fieldInfos: [{
            fieldName: selField,
            label: "Name: ",
            visible: true
          }, {
              fieldName: "SHAPE_Area",
              label: "sqm: ",
              visible: true,
              format: {
                places: 2,
                digitSeparator: false
              }
            }]
        });
        //get result features
        var features = values[0].value.features;
        //add features to map
        for (var f = 0, fl = features.length; f < fl; f++) {
          var feature = features[f];
          this.map.infoWindow.clearFeatures();
          feature.setInfoTemplate(template);
          this.map.graphics.setRenderer(this.renderer);
          this.map.graphics.add(feature);
        }
        //set transparent results
        this.map.graphics.setOpacity(0.7);
        //render chart
        this._createChart(values[1]);
        //zoom to extent of user defined area
        /*   if (features.length > 0) {
             try {
               var extent = graphicsUtils.graphicsExtent(this.map.graphics);
               if (extent) {
                 this.map.setExtent(extent.expand(1.4));
                 //this.drawBox.clear();
               }
             } catch (e) {
               console.error(e);
             }
           } */
      },

      _getRenderer: function (renLayer) {

        //fetch renderer from Map Service
        var layersRequest = esriRequest({
          url: renLayer,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        });
        layersRequest.then(lang.hitch(this, function (response) {

          var renderer = new UniqueValueRenderer(response.drawingInfo.renderer);
          this.renderer = renderer;

        }), lang.hitch(this, function (err) {
          console.error(err);
          new Message({
            message: err.message || err
          });
        }));
      },

      _processRenderer: function (item) {

      },

      _createChart: function (resultTbl) { //use renderer and summary table to chart results

        var data = [];
        var lcColor = null;

        var table = resultTbl.value.features;
        var nameField = dijit.byId("selectField").get("value")
        for (var t = 0, tl = table.length; t < tl; t++) {
          var record = table[t];
          var atts = record.attributes
          var attName = atts[nameField];

          array.forEach(this.renderer.infos, function (item) {
            if (item.label == attName) {
              lcColor = item.symbol.color.toHex();
            } else if (item.value == attName) {
              lcColor = item.symbol.color.toHex();
              attName = item.label
            }
          });

          var lcHa = record.attributes.AreaHa;
          var ha = lcHa;
          var item = {
            "value": ha,
            "color": lcColor,
            "label": attName
          };

          data.push(item);
        }

        var options = {
          segmentShowStroke: true,
          segmentStrokeColor: "#fff",
          segmentStrokeWidth: 1,
          percentageInnerCutout: 50, // This is 0 for Pie charts
          animationSteps: 100,
          animationEasing: "easeOutBounce",
          animateRotate: true,
          animateScale: false,
          tooltipTemplate: "<%if (label)%><%= value %>Ha",
          legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"
        }
        var helpers = Chart.helpers;
        var canvas = document.createElement('canvas');

        canvas.id = "myChart";
        canvas.width = 300;
        canvas.height = 200;
        canvas.style.position = "absolute";

        var canvasNode = this.canvas //document.getElementById("canvas");
        canvasNode.appendChild(canvas)

        var legend = document.createElement('div');
        legend.id = "myLegend";

        var legendNode = this.legend //document.getElementById("legend");
        legendNode.appendChild(legend)

        var ctx = document.getElementById("myChart").getContext("2d");

        var myDoughnutChart = new Chart(ctx).Doughnut(
          data,
          options);

        legend.innerHTML = myDoughnutChart.generateLegend()

        helpers.each(legend.firstChild.childNodes, function (legendNode, index) {
          helpers.addEvent(legendNode, 'mouseover',
            function () {
              var activeSegment = myDoughnutChart.segments[index];
              activeSegment.save();
              activeSegment.fillColor = activeSegment.highlightColor;
              myDoughnutChart.showTooltip([activeSegment]);
              activeSegment.restore();
            });
        });
        helpers.addEvent(legend.firstChild, 'mouseout',
          function () {
            myDoughnutChart.draw();
          });
      },

      _onExecuteClick: function () {
        if (html.hasClass(this.exeNode, 'jimu-state-disabled')) {
          return;
        }
        //set gp parameters
        var inputFeatures = new FeatureSet()
        inputFeatures.geometryType = "esriGeometryPolygon";
        inputFeatures.features = this.drawBox.drawLayer.graphics;
        var inputField = this.selectField.get("value");

        var taskParams = {
          "Field": inputField,
          "Feature_Set": inputFeatures
        };
        //console.log(taskParams)
        this.executeGP(taskParams);
      },


      onOpen: function () {
        this._onChangeLayer()
        //console.log('onOpen');
      },

      onClose: function () {
        //console.log('onClose');
      },

      onMinimize: function () {
        //console.log('onMinimize');
      },

      onMaximize: function () {
        //console.log('onMaximize');
      },

      onSignIn: function (credential) {
        /* jshint unused:false*/
        //console.log('onSignIn');
      },

      onSignOut: function () {
        //console.log('onSignOut');
      },

      _bindEvents: function () {
        //Fires when layer selection changed
        this.own(on(this.selectLayer, 'change', lang.hitch(this, this._onChangeLayer)));
        //Fires when field selection changed
        this.own(on(this.selectField, 'change', lang.hitch(this, this._onChangeField)));
        //bind DrawBox events
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));
        
        this._setDrawDefaultSymbols();
      },

      _setDrawDefaultSymbols: function () {

        this.drawBox.setPolygonSymbol(this._getPolygonSymbol());
      },

      _getPolygonSymbol: function () {
        var symbol = new SimpleFillSymbol();
        symbol.setStyle(SimpleFillSymbol.STYLE_NULL)
        return symbol
        //return this.fillSymChooser.getSymbol();
      },

      _onDrawEnd: function (graphic, geotype, commontype) {

      },

      _onBtnClearClicked: function () {
        this.drawBox.clear();
      },

      _clearLastResult: function () {

        if (document.getElementById("myChart")) {
          html.destroy(document.getElementById("myChart"));
        }
        if (document.getElementById("myLegend")) {
          html.destroy(document.getElementById("myLegend"));
        }

        this.map.graphics.clear();

      },
      _onChangeLayer: function () {
        this.layerSelection = this.selectLayer.get("value") //dijit.byId("selectLayer").get("value")
        var renUrl = this.config.model.renUrl;
        switch (this.layerSelection) {
          case "Soil":
            this.config.model.gpUrl = this.config.model.soilUrl;
            this.selectField.removeOption(this.selectField.getOptions());
            this.selectField.addOption({ value: "TextureDom", label: "Dominant Texture", selected: true })
            this.selectField.addOption({ value: "DrainDom", label: "Dominant Drainage", selected: false })
            this.selectField.addOption({ value: "DepthDom", label: "Dominant Depth", selected: false })
            this._getRenderer(renUrl + 5);
            break;
          case "Landcover":
            this.config.model.gpUrl = this.config.model.landUrl;
            this.selectField.removeOption(this.selectField.getOptions());
            this.selectField.addOption({ value: "Name_2012", label: "Name_2012", selected: true })
            this.selectField.addOption({ value: "Name_2008", label: "Name_2008", selected: false })
            this.selectField.addOption({ value: "Name_2001", label: "Name_2001", selected: false })
            this.selectField.addOption({ value: "Name_1996", label: "Name_1996", selected: false })
            this._getRenderer(renUrl + 1);
            break;
          default:
            console.log("nothing")
        }
        //set gp help link **todo set from gp task
        var gpLayer = this.config.model.gpUrl
        var layersRequest = esriRequest({
          url: gpLayer, //this.config.model.gpUrl,
          content: { f: "json" },
          handleAs: "json",
          callbackParamName: "callback"
        });
        
        layersRequest.then(lang.hitch(this, function (response) {
            //console.log(response);
            html.setAttr(this.helpLinkNode, 'href', response.helpUrl)
          }));
      },
      _onChangeField: function () {
        //setup result popuptemplate
        this.fieldSelection = this.selectField.get("value")
        var renUrl = this.config.model.renUrl;
        var renLayer;
        //select renderer Url for selected field
        switch (this.fieldSelection) {
          case "Name_2012":
            renLayer = renUrl + "1";
            this._getRenderer(renLayer);
            break;
          case "Name_2008":
            renLayer = renUrl + "2";
            this._getRenderer(renLayer);
            break;
          case "Name_2001":
            renLayer = renUrl + "3";
            this._getRenderer(renLayer);
            break;
          case "Name_1996":
            renLayer = renUrl + "4";
            this._getRenderer(renLayer);
            break;
          case "TextureDom":
            renLayer = renUrl + "5";
            this._getRenderer(renLayer);
            break;
          case "DrainDom":
            renLayer = renUrl + "6";
            this._getRenderer(renLayer);
            break;
          case "DepthDom":
            renLayer = renUrl + "7";
            this._getRenderer(renLayer);
            break;
          default:
            console.log("error");
        }

      }
    });

    return clazz;
  });
