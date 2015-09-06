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

define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/NumberTextBox',
    'dijit/form/CheckBox'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-timeslider-setting',

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        if (!this.config) {
          this.config = {};
        }
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        
        if (config.datetimeformat !== undefined) {
          this.selectFormat.set('value', config.datetimeformat);
        }
        this.showLabelsBox.set('checked', config.showLabels);
        
      },

      getConfig: function() {
        this.config.datetimeformat = this.selectFormat.get('value')
        this.config.showLabels = this.showLabelsBox.checked;
        return this.config;
      }
    });
  });