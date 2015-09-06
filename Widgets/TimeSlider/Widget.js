///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/fx',
    'dojo/on',
    'dojo/sniff',
    'dojo/Deferred',
    'jimu/LayerInfos/LayerInfos',
    'jimu/BaseWidget',
    'jimu/utils',
    'esri/lang',
    'dojo/date/locale',
    'esri/TimeExtent',
    'esri/dijit/TimeSlider'
  ],
  function(declare, lang, html, array, baseFx, on, has, Deferred,
    LayerInfos, BaseWidget, utils, esriLang, locale, TimeExtent, TimeSlider) {

    var clazz = declare([BaseWidget], {
      baseClass: 'jimu-widget-timeslider',
      clasName: 'esri.widgets.TimeSlider',
      _showed: false,
      // _enabled: true,
      _timeHandles: null,
      layerInfosObj: null,

      postCreate: function() {
        this.inherited(arguments);
        this._timeHandles = [];
        this.getTimeSliderProps(this.map).then(lang.hitch(this, function() {
          LayerInfos.getInstance(this.map, this.map.itemInfo)
            .then(lang.hitch(this, function(layerInfosObj) {
              this.layerInfosObj = layerInfosObj;
              // should check whether is timeInfo layer.
              this.own(on(
                layerInfosObj,
                'layerInfosIsShowInMapChanged',
                lang.hitch(this, this._onLayerInfosIsShowInMapChanged)));
              this.own(layerInfosObj.on(
                'layerInfosChanged',
                lang.hitch(this, this._onLayerInfosChanged)));

              this.processTimeDisableLayer();
            }));
        }));
      },

      startup: function() {
        this.inherited(arguments);
        this.own(on(this.map, 'resize', lang.hitch(this, this._onMapResize)));
      },

      _isTimeTemporalLayer: function(layer, mustVisible) {
        var _hasValidTime = layer && layer.timeInfo && layer.useMapTime;
        var _layerInfo = this.layerInfosObj.getLayerInfoById(layer.id);
        var timeAnimation = _layerInfo && _layerInfo.originOperLayer &&
          (_layerInfo.originOperLayer.timeAnimation !== false);
        var condition = _hasValidTime && timeAnimation && (mustVisible ? layer.visible : true);

        if (condition) {
          var layerType = layer.declaredClass;
          if (layerType === "esri.layers.KMLLayer") {
            var internalLayers = layer.getLayers();
            var some = array.some(internalLayers, function(kLayer) {
              if (kLayer.timeInfo && kLayer.timeInfo.timeExtent) {
                return true;
              }
              return false;
            });
            if (some) {
              return true;
            }
          } else if (layer.timeInfo && layer.timeInfo.timeExtent) {
            return true;
          }
        }

        return false;
      },

      _processTimeUpdate: function(layer) {
        var _layerInfo = null;
        var timeAnimation = true;
        _layerInfo = this.layerInfosObj.getLayerInfoById(layer.id);
        timeAnimation = _layerInfo && _layerInfo.originOperLayer &&
          (_layerInfo.originOperLayer.timeAnimation !== false);
        if (!timeAnimation && 'setUseMapTime' in layer) {
          layer.setUseMapTime(false);
        }
      },

      processTimeDisableLayer: function() {
        var i = 0,
          len, layer, layerId;
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          this._processTimeUpdate(layer);
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          this._processTimeUpdate(layer);
        }
      },

      hasVisibleTemporalLayer: function() {
        var i = 0,
          len, layer, layerId;
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            return true;
          }
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            return true;
          }
        }

        return false;
      },

      _onLayerInfosIsShowInMapChanged: function(changedLayerInfos) {
        var timeTemporalLayerChanged = array.some(
          changedLayerInfos,
          lang.hitch(this, function(layerInfo) {
            var _layer = null;
            while (!_layer) {
              _layer = this.map.getLayer(layerInfo.id);
              layerInfo = layerInfo.parentLayerInfo;
            }

            return this._isTimeTemporalLayer(_layer);
          }));

        if (timeTemporalLayerChanged) {
          this._onTimeTemportalLayerChanged();
        }
      },

      _onLayerInfosChanged: function(layerInfo, changedType, layerInfoSelf) {
        /* jshint unused:true */
        if (changedType === 'added') {
          var _layer = this.map.getLayer(layerInfoSelf.id);
          var visibleTimeTemporalLayerChanged = this._isTimeTemporalLayer(_layer, true);

          if (visibleTimeTemporalLayerChanged) {
            this._onTimeTemportalLayerChanged();
          }
        } else if (changedType === 'removed') {
          this._onTimeTemportalLayerChanged();
        }
      },

      _onTimeTemportalLayerChanged: function() {
        if (this.state !== 'closed') {
          if (this.hasVisibleTemporalLayer()) {
            if (this.timeSlider) {
              this.updateLayerLabel();
            } else {
              // this.createTimeSlider();
              this.showTimeSlider();
            }
          } else {
            if (this.timeSlider) {
              this.closeTimeSlider();
            }
            // html.setStyle(this.noTimeContentNode, 'display', 'block');
          }
        }
      },

      onOpen: function() {
        if (!this.hasVisibleTemporalLayer()) {
          html.setStyle(this.noTimeContentNode, 'display', 'block');
          html.setStyle(this.timeContentNode, 'display', 'none');
          this._showed = true;
        } else {
          if (!this._showed) {
            this.showTimeSlider();
          }
        }
      },

      onClose: function() {
        if (!this.hasVisibleTemporalLayer()) {
          html.setStyle(this.noTimeContentNode, 'display', 'none');
          this._showed = false;
        } else {
          if (this._showed) {
            this.closeTimeSlider();
          }
        }
      },

      _isRunInMobile: function() {
        return window.appInfo.isRunInMobile;
      },

      showTimeSlider: function() {
        html.setStyle(this.noTimeContentNode, 'display', 'none');
        this.createTimeSlider();
        html.setStyle(this.timeContentNode, 'display', 'block');
        html.addClass(this.domNode, 'show-time-slider');

        this._adaptResponsive();

        if (has('ie') && has('ie') < 9) {
          this._showed = true;
        } else {
          baseFx.animateProperty({
            node: this.timeContentNode,
            properties: {
              opacity: {
                start: 0,
                end: 1
              }
            },
            onEnd: lang.hitch(this, function() {
              this._showed = true;
            }),
            duration: 500
          }).play();
        }
      },

      closeTimeSlider: function() {
        html.setStyle(this.domNode, 'display', 'block');
        if (has('ie') && has('ie') < 9) {
          this._onCloseTimeSliderEnd();
        } else {
          baseFx.animateProperty({
            node: this.timeContentNode,
            properties: {
              opacity: {
                start: 1,
                end: 0
              }
            },
            onEnd: lang.hitch(this, this._onCloseTimeSliderEnd),
            duration: 500
          }).play();
        }
      },

      _onCloseTimeSliderEnd: function() {
        this.removeTimeSlider();
        this._showed = false;

        html.setStyle(this.timeContentNode, 'display', 'none');
        html.removeClass(this.domNode, 'show-time-slider');

        if (this.state !== 'closed') {
          html.setStyle(this.noTimeContentNode, 'display', 'block');
        }

        if (this.state === 'closed') {
          html.removeClass(this.domNode, 'mobile-time-slider');
          html.removeClass(this.timeContentNode, 'mobile');
        }
      },

      getTimeSliderProps: function(map) {
        var def = new Deferred();
        var itemInfo = map && map.itemInfo;
        if (itemInfo && itemInfo.itemData && itemInfo.itemData.widgets &&
          itemInfo.itemData.widgets.timeSlider && itemInfo.itemData.widgets.timeSlider.properties) {
          def.resolve(itemInfo.itemData.widgets.timeSlider.properties);
        } else {
          def.resolve(null);
        }

        return def;
      },

      createTimeSlider: function() {
        if (!this.timeSlider) {
          this.getTimeSliderProps(this.map).then(lang.hitch(this, function(props) {
            this.timeSlider = new TimeSlider({}, this.sliderNode);
            this.map.setTimeSlider(this.timeSlider);
            var fromTime = new Date(props.startTime);
            var endTime = new Date(props.endTime);

            var timeExtent = new TimeExtent(fromTime, endTime);
            this.timeSlider.setThumbCount(props.thumbCount);
            if (props.numberOfStops) {
              this.timeSlider.createTimeStopsByCount(timeExtent, (props.numberOfStops + 1));
            } else {
              this.timeSlider.createTimeStopsByTimeInterval(
                timeExtent,
                props.timeStopInterval.interval,
                props.timeStopInterval.units
              );
            }
            this.timeSlider.setThumbMovingRate(props.thumbMovingRate);

            if (this.timeSlider.timeStops.length > 25) {
              this.timeSlider.setTickCount(0);
            }
            if (this.timeSlider.thumbCount === 2) {
              this.timeSlider.setThumbIndexes([0, 1]);
            }

            this.timeSlider.setLoop(true);
            this.timeSlider.startup();
            html.addClass(this.timeSlider.domNode, 'jimu-float-leading');

            this.updateLayerLabel();
            var info = this._formatLabel(this.map.timeExtent);
            this.updateTimeExtentLabel(info);

            this._timeHandles.push(on(
              this.timeSlider,
              'time-extent-change',
              lang.hitch(this, function (e) {
                var timeInfo = this._formatLabel(e);
                this.updateTimeExtentLabel(timeInfo)
              })));
          }));
        }
      },

      _onSelectSpeedItem: function(evt) {
        if (evt.target) {
          var rate = html.getAttr(evt.target, 'speed');
          this.getTimeSliderProps(this.map).then(lang.hitch(this, function(props) {
            if (props && rate) {
              rate = parseFloat(rate);
              this.timeSlider.setThumbMovingRate(props.thumbMovingRate / rate);
              this.speedLabelNode.innerHTML = evt.target.innerHTML;
            }
            html.setStyle(this.speedMenu, 'display', 'none');
          }));
        }
      },

      _onSpeedLabelClick: function() {
        html.setStyle(this.speedMenu, 'display', 'block');
      },

      _onMouseEnterSpeedContainer: function() {
        html.setStyle(this.speedMenu, 'display', 'block');
      },

      _onMouseLeaveSpeedContainer: function() {
        html.setStyle(this.speedMenu, 'display', 'none');
      },

      updateTimeSlider: function() {
        if (this.timeSlider) {
          var isPlaying = this.timeSlider.playing;
          this.removeTimeSlider();
          this.createTimeSlider();
          if (isPlaying) {
            this.timeSlider.play();
          }
        }
      },

      removeTimeSlider: function() {
        array.forEach(this._timeHandles, function(handle) {
          if (handle && handle.remove) {
            handle.remove();
          }
        });
        this.timeSlider.destroy();
        this.timeSlider = null;
        if (this.map) {
          this.map.setTimeExtent(null);
        }
        this.sliderNode = html.create('div', {}, this.speedContainerNode, 'before');
      },

      updateLayerLabel: function() {
        if (this.config.showLabels) {
          html.setStyle(this.layerLabelsNode, 'display', 'block');
          var label = this.nls.layers;
          var names = this._getVisibleTemporalLayerNames();
          label = label + names.join(',');
          this.layerLabelsNode.innerHTML = label;
          html.setAttr(this.layerLabelsNode, 'title', label);
        } else {
          html.setStyle(this.layerLabelsNode, 'display', 'none');
        }
      },

      updateTimeExtentLabel: function(timeExtent) {
        var label = this.nls.timeExtent;
        var start = null;
        var end = null;
        console.log(timeExtent)
        if (!timeExtent) {
          if (this.timeSlider.thumbCount === 2) {
            start = this.timeSlider.timeStops[0];
            end = this.timeSlider.timeStops[1];
          } else {
            start = this.timeSlider.timeStops[0];
          }
        } else {
          start = timeExtent.startTime;
          //if (timeExtent.endTime.getDate() - timeExtent.startTime.getDate() > 0) {
          //  end = timeExtent.endTime;
          //}
          if (Math.abs(timeExtent.endTime - timeExtent.startTime) > 0) {
            end = timeExtent.endTime;
          }
        }

        if (end) {
          label = esriLang.substitute({
            FROMTIME: utils.localizeDate(start),
            ENDTIME: utils.localizeDate(end)
          }, label);
        } else {
          label = utils.localizeDate(start);
        }

        this.timeExtentLabelNode.innerHTML = label;
      },
      _formatLabel: function (timeExtent) {
            //Use the date/time format specified during app configuration or
            //choose an appropriate date/time format based on the input time
            //extent. 
            var startDatePattern = null;
            var endDatePattern = null;
            var startTimePattern = null;
            var endTimePattern = null;


            var start = timeExtent.startTime,
                end = timeExtent.endTime;

            if (this.config.datetimeformat) {
                startDatePattern = this.config.datetimeformat;
                endDatePattern = this.config.datetimeformat;
            } else {
                //calculate an appropriate start and end time pattern
                if (end.toUTCString() === start.toUTCString()) {
                    end = null; //strings match so set end to null
                }
                if (end && start.getFullYear() == end.getFullYear()) {
                    if (start.getMonth() == end.getMonth()) {
                        if (start.getDate() == end.getDate()) {
                            if (start.getHours() == end.getHours()) {
                                if (start.getMinutes() == end.getMinutes()) {
                                    if (start.getSeconds() == end.getSeconds()) {
                                        // same second
                                        //end = null; //don't show same second
                                        startDatePattern = this.config.i18n.time.datePattern;
                                        startTimePattern = this.config.i18n.time.millisecondTimePattern;
                                        endTimePattern = this.config.i18n.time.millisecondTimePattern;
                                    } else { // same minute
                                        startDatePattern = this.config.i18n.time.datePattern;
                                        startTimePattern = this.config.i18n.time.secondTimePattern;
                                        endTimePattern = this.config.i18n.time.secondTimePattern;
                                    }
                                } else { // same hour
                                    startDatePattern = this.config.i18n.time.datePattern;
                                    startTimePattern = this.config.i18n.time.minuteTimePattern;
                                    endTimePattern = this.config.i18n.time.minuteTimePattern;
                                }
                            } else { // same day
                                startDatePattern = this.config.i18n.time.datePattern;
                                startTimePattern = this.config.i18n.time.hourTimePattern;
                                endTimePattern = this.config.i18n.time.hourTimePattern;
                            }
                        } else { // same month
                            if (end.getDate() - start.getDate() < 2) {
                                // less than 2 days
                                startDatePattern = this.config.i18n.time.datePattern;
                                startTimePattern = this.config.i18n.time.hourTimePattern;
                                endDatePattern = this.config.i18n.time.datePattern;
                                endTimePattern = this.config.i18n.time.hourTimePattern;
                            } else {
                                startDatePattern = this.config.i18n.time.datePattern;
                                endDatePattern = this.config.i18n.time.datePattern;
                            }
                        }
                    } else { // same year
                        startDatePattern = this.config.i18n.time.datePattern;
                        endDatePattern = this.config.i18n.time.datePattern;
                    }
                } else if (end && end.getFullYear() - start.getFullYear() > 2) {
                    startDatePattern = this.config.i18n.time.yearPattern;
                    endDatePattern = this.config.i18n.time.yearPattern;
                } else {
                    startDatePattern = this.config.i18n.time.datePattern;
                    endDatePattern = this.config.i18n.time.datePattern;
                }

            }

            var startTime = locale.format(start, {
                datePattern: startDatePattern,
                timePattern: startTimePattern,
                selector: (startDatePattern && startTimePattern) ? null : (startDatePattern ? "date" : "time")
            });
            var endTime = null;
            if (end) {
                endTime = locale.format(end, {
                    datePattern: endDatePattern,
                    timePattern: endTimePattern,
                    selector: (endDatePattern && endTimePattern) ? null : (endDatePattern ? "date" : "time")
                });
            }

            return {
                startTime: startTime,
                endTime: endTime,
                startDatePattern: startDatePattern,
                endDatePattern: endDatePattern,
                startTimePattern: startTimePattern,
                endTimePattern: endTimePattern,
                end: end,
                start: start
            };

        },
      _getVisibleTemporalLayerNames: function() {
        var i = 0,
          len, layer, layerId;
        var ids = [];
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            ids.push(layer.id);
          }
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            ids.push(layer.id);
          }
        }

        var names = array.map(ids, lang.hitch(this, function(id) {
          var info = this.layerInfosObj.getLayerInfoById(id);
          return info.title || "";
        }));

        return names;
      },
      _adaptResponsive: function() {
        if (!this.timeSlider) {
          return;
        }
        setTimeout(lang.hitch(this, function() {
          var _w = null;
          var layoutBox = html.getMarginBox(window.jimuConfig.layoutId);
          var aPos = html.position(this.domNode);
          var sliderContentBox = html.getContentBox(this.sliderContent);
          var speedBox = html.getMarginBox(this.speedContainerNode);
          if (window.appInfo.isRunInMobile) {
            html.addClass(this.timeContentNode, 'mobile');
            html.addClass(this.domNode, 'mobile-time-slider');
          } else {
            html.removeClass(this.timeContentNode, 'mobile');
            html.removeClass(this.domNode, 'mobile-time-slider');
          }
          _w = sliderContentBox.w - speedBox.w;
          html.setStyle(this.timeSlider.domNode, 'width', _w + 'px');
        }), 10);

      },

      _onMapResize: function() {
        if (this.state === 'closed') {
          return;
        }

        this._adaptResponsive();
      },

      destroy: function() {
        if (this.map) {
          this.map.setTimeExtent(null);
        }
        this.inherited(arguments);
      }
    });
    return clazz;
  });