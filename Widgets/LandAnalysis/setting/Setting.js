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
  'dijit/form/TextBox',
  'dijit/form/CheckBox'
],
  function (
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-landAnalysis-setting',

      startup: function () {
        this.inherited(arguments);
        if (!this.config) {
          this.config = {};
        }
        this.setConfig(this.config);
      },
      setConfig: function (config) {
        this.config = config;

        if (config.model.renUrl !== undefined) {
          this.renUrl.set('value', config.model.renUrl);
        }
        if (config.model.landUrl !== undefined) {
          this.landUrl.set('value', config.model.landUrl);
        }
        if (config.model.soilUrl !== undefined) {
          this.soilUrl.set('value', config.model.soilUrl);
        }

        this.isSynchronous.set('checked', config.model.isSynchronous);
        this.isPopupExecute.set('checked', config.isPopupExecute);
      },

      getConfig: function () {

        this.config.model.renUrl = this.renUrl.get('value')
        this.config.model.landUrl = this.landUrl.get('value')
        this.config.model.soilUrl = this.soilUrl.get('value')
        this.config.isSynchronous = this.isSynchronous.checked;
        this.config.isPopupExecute = this.isPopupExecute.checked;

        return this.config;
      }
    });
  });
