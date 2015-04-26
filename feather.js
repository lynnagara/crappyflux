'use strict';

var Feather = function() {};

Feather.App = function () {};

Feather.App.Component = function (component) {
    this.app = component.app;
	this.template = component.template;
    this.init = component.init;
    this.props = {};
    // Run init() code
    if (this.init) { this.init(); }
    // Replace template variables
    var pattern = /\{\{(.*?)\}\}/g;
    var self = this;
    this._template = this.template.replace(pattern, function(whole, name) {
        if (self.props[name]) {
            return self.props[name];
        } else {
            return whole;
        }
    });
}

// Renders the base component
Feather.App.Component.prototype.renderComponent = function() {
    var view = document.body;
    view.innerHTML = '';
    var element = document.createElement('div');
    element.innerHTML = this._render();
    view.appendChild(element);
}

Feather.App.Component.prototype._render = function (state) {
    var pattern = /\{\{(.*?)\}\}/g; // nongreedy mustaches

    function replaceVariables(match, variable){
        return '' + state[variable];
    }
    var variable = this._template.replace(pattern, replaceVariables);	

    function replaceTags(whole, name, propsString) {
        var pattern = /(\w+)="(.*?)"/g;
        var props = {};
        var m;
        while (m = pattern.exec(propsString)) {
            props[m[1]] = m[2];
        }
        return this.app[name]._render(props);
    }
    return variable.replace(/<(\w+) ([^><]+?)\/>/g, replaceTags.bind(this));
}



