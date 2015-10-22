define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget', 'dojo/on',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/dom',
    'dijit/registry',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/parser',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    'esri/domUtils',
    'esri/dijit/Popup',
    'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'
  ],
  function(declare, _WidgetsInTemplateMixin, BaseWidget, on,
    arrayUtils,
    connect,
    dom,
    registry,
    lang,
    domConstruct,
    parser,
    BorderContainer,
    ContentPane,
    domUtils,
    Popup,
    $) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // DemoWidget code goes here

      //please note that this property is be set by the framework when widget is loaded.
      //templateString: template,

      baseClass: 'jimu-widget-popup-panel',
      popup: null,

      postCreate: function() {
        this.inherited(arguments);
        this.map.infoWindow.set("popupWindow", false);
      	//console.log(this.map)
        //console.log('postCreate');
      },

      startup: function() {
        this.inherited(arguments);
        parser.parse();
        var previous = dom.byId("previous")
        var next = dom.byId("next")
        this.own(on(this.previous, "click", lang.hitch(this, this._selectPrevious)));
        this.own(on(this.next, "click", lang.hitch(this, this._selectNext)));
        this.popup = this.map.infoWindow;

        //when the selection changes update the side panel to display the popup info for the
        //currently selected feature.

        this.own(connect.connect(this.popup, "onSelectionChange", lang.hitch(this, function() {
          this._displayPopupContent(this.popup.getSelectedFeature())
        })));
        this.own(connect.connect(this.popup, "onClearFeatures", lang.hitch(this, this._onClearFeatures)));
        this.own(connect.connect(this.popup, "onSetFeatures", lang.hitch(this, this._onSetFeatures)));

        console.log('startup');
      },

      onOpen: function() {
        console.log('onOpen');
      },

      onClose: function() {
        console.log('onClose');
      },

      onMinimize: function() {
        console.log('onMinimize');
      },

      onMaximize: function() {
        console.log('onMaximize');
      },

      onSignIn: function(credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function() {
        console.log('onSignOut');
      },
      _onClearFeatures: function() {
        //when the selection is cleared remove the popup content from the side panel.
        //dom.byId replaces dojo.byId
        dom.byId("featureCount").innerHTML = "Click to select feature(s)";
        //registry.byId replaces dijit.byId
        //this.popupInfo,innerHTML = ""
        registry.byId("popup").set("content", "");
        domUtils.hide(dom.byId("pager"));
      },
      _onSetFeatures: function() {
        //When features are associated with the  map's info window update the sidebar with the new content.
        this._displayPopupContent(this.popup.getSelectedFeature());
        dom.byId("featureCount").innerHTML = this.popup.features.length + " feature(s) selected";

        //enable navigation if more than one feature is selected
        this.popup.features.length > 1 ? domUtils.show(dom.byId("pager")) : domUtils.hide(dom.byId("pager"));
      },
      _displayPopupContent: function(feature) {
        if (feature) {
          var content = feature.getContent();
					this.map.setExtent(feature._extent.expand(2))
					console.log(feature)
          //this.popupInfo.innerHTML = content
          //console.log(feature)
          registry.byId("popup").set("content", content);

          var objectId = feature.attributes.OBJECTID
          feature._layer.queryAttachmentInfos(objectId, function(infos) {
            var itemJson = []
            var len = infos.length;
            for (var i = 0; i < len; i++) {
              itemJson.push({
                url: infos[i].url,
                type: infos[i].contentType,
                name: infos[i].name,

              });
            }

            _setSlider(itemJson);
          });
        }
      },
      _setSlider: function(itemJson) {
        var sliderFrame = document.getElementById("slider");
        var mySlider = sliderFrame.hasChildNodes()
        if (mySlider) {
          dojo.empty(sliderFrame)
        }

        var div = domConstruct.create("div", {
          id: 'slides'
        });
        console.log(itemJson)
        arrayUtils.forEach(itemJson, function(data) {
          domConstruct.create("img", {
            src: data.url,
            alt: data.name
          }, div);
        });
        //registry.byId("leftPane").set("content", content);
        document.getElementById("slider").appendChild(div)
        $('#slides').slidesjs({
          width: 200,
          height: 100
        });
      },
      _selectPrevious: function() {
        this.map.infoWindow.selectPrevious();
      },

      _selectNext: function() {
        this.map.infoWindow.selectNext();
      }
    });
  });
