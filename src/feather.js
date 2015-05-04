'use strict';

+(function (scope){

    var Feather = function () {};

    Feather.App = function () {
        this.components = {};
        this.baseComponents = []; // Array of the base level component names

        // Data structure to hold the information about the nodes
        this._nodes = {};

    }

    Feather.App.prototype.createComponent = function (component) {
        if (component.el) {
            this.baseComponents.push(component.name);
        }

        this.components[component.name] = new Feather.App.Component({
            app: this,
            name: component.name,
            el: component.el,
            init: component.init,
            template: component.template
        });
    }

    // Calls render() on the base component/s of the app
    Feather.App.prototype.render = function () {
        this.baseComponents.forEach(function(component) {
            this.components[component].render();
        }, this);
    }

    Feather.App.Component = function (component) {
        this.app = component.app;
        this.el = component.el;
        this.props = {};
        this.template = component.template;
        this.init = component.init;
        this._childNodes = {}; // Empty for now
        // Run any init() code
        if (this.init) { this.init(); }
        // Compile the template
        this._template = this._compile();
    }

    // Replaces all props variables
    Feather.App.Component.prototype._compile = function () {
        var tag_pattern = /\{\{(.*?)\}\}/g;
        var whitespace_pattern = />(\s+?)</g;
        var each_pattern = /\{\{\#each\s(.+?) in (.+?)\}\}(.*?)\{\{\/each\}\}/g;
        // var onclick_pattern = /onclick=\{\{(.*?)\}\}/g;
        var self = this;

        function replaceEachTags(whole, m1, m2, m3) {
            var iterator_pattern = /\{\{(.*?)\}\}/g;
            return self.props[m2]
                .map(function(i) {
                    return m3.replace(iterator_pattern, function(whole2, match) {
                        // Matches the object recursively
                        var a, b, b1;
                        function matchObject (obj, item) {
                            a = obj.split('.',1)[0];
                            b = obj.split(/\.(.*)/)[1];
                            
                            if (!b) {
                                return (typeof item === 'object') ? JSON.stringify(item) : item;
                            } else {
                                b1 = b.split('.',1)[0];
                                if (item[b1]) {
                                    return matchObject(b, item[b1]);
                                } else {
                                    return '';
                                }
                            }
                        }

                        if (m1 === match.split('.')[0]) {
                            // Start matching recursively
                            return matchObject(match, i);
                        } else {
                            return whole2;
                        }

                    });    
                })
                .join('');
        }

        function replacePropTags(whole, name) {
            if (self.props[name]) {
                return self.props[name];
            } else {
                return whole;
            }
        }

        // function replaceOnClickTags(whole, func) {
        //     // Get the id of the node and add a click listener....
        // }

        // Replace the tags and strip the whitespace
        return this.template()
        .replace(each_pattern, replaceEachTags)
        // .replace(onclick_pattern, replaceOnClickTags.bind(this))
        .replace(tag_pattern, replacePropTags)
        .replace(whitespace_pattern, '><');
    }

    // Only do render() if we are in a browser
    Feather.App.Component.prototype.render = function () {
        if (typeof window !== 'undefined') {
            var view = this.el;
            view.innerHTML = '';
            var element = document.createElement('div');
            element.innerHTML = this._renderComponent();
            view.appendChild(element);
        }
    }

    Feather.App.Component.prototype._renderComponent = function (state, parent) {
        function getPosInNodeList(self, parentNodeList) {
            var key = 0;
            while (true) {
                if (!parentNodeList.hasOwnProperty(key)) {
                    return key;
                } else {
                    key += 1;
                }
            }
        }

        function replaceVariables (match, variable) {
            // Prints an empty string if undefined
            return '' + (state[variable] || '');
        }

        function replaceTags(whole, name, propsString) {
            var pattern = /(\w+)="(.*?)"/g;
            var props = {};
            var m;
            while (m = pattern.exec(propsString)) {
                props[m[1]] = m[2];
            }
            return this.app.components[name]._renderComponent(props, this);
        }

        // Update the _nodes list
        var parentNodeList = parent ? parent._childNodes : this.app._nodes;
        var pos = getPosInNodeList(this, parentNodeList);
        parentNodeList[pos] = this;

        var pattern = /\{\{(.*?)\}\}/g;

        return this._template
            .replace(pattern, replaceVariables)
            .replace(/<(\w+)([^><]+?)\/>/g, replaceTags.bind(this));
    }

    // Export global variable
    scope.Feather = Feather;

})(this);

