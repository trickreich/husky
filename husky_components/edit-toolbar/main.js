/**
 * This file is part of Husky frontend development framework.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 * @module husky/components/edit-toolbar
 */

/*
 *
 *  edit-toolbar
 *
 *  Options (defaults)
 *      - url: url to fetch data from
 *      - data: if no url is provided
 *      - instanceName - enables custom events (in case of multiple tabs on one page)
 *      - appearance -
 *  Provides Events
 *      - husky.edit-toolbar.<<instanceName>>.item.disable [id] - disable item with given id
 *      - husky.edit-toolbar.<<instanceName>>.item.loading [id]- shows loading icon
 *      - husky.edit-toolbar.<<instanceName>>.item.enable [id]- enable item with given id
 *
 *  Triggers Events
 *      - husky.edit-toolbar.<<instanceName>>.item.select - triggered when item was clicked
 *
 *  data structure:
 *      - title
 *      - id (optional - will be generated otherwise)
 *      - icon (optional)
 *      - disableIcon (optional): icon when item is disabled
 *      - disabled (optional): is item disabled or enabled
 *      - iconSize (optional: large/medium/small)
 *      - class (optional: highlight/highlight-gray)
 *      - group (optional: left/right)
 *      - type (optional: none/select) - if select, the selected item is displayed in mainitem
 *      - callback (optional) - callback function
 *      - items (optional - if dropdown):
 *          - title
 *          - icon (optional) false will remove icon
 *          - callback
 *          - divider = true; takes item as divider element
 *
 *
 */

/**
 * @class EditToolbar
 * @constructor
 *
 * @param {Object} [options] Configuration object
 * @param {String} [options.url] url to fetch data from
 * @param {String} [options.data] if no url is provided
 * @param {String} [options.instanceName] enables custom events (in case of multiple tabs on one page)
 * @param {String} [options.appearance]
 */
define(function() {

    'use strict';

    var defaults = {
            url: null,
            data: [],
            instanceName: '',
            appearance: null // TODO: implement small version
        },

        /** templates container */
            templates = {
            skeleton: [
                '<div class="edit-toolbar-container">',
                '   <nav class="edit-toolbar-nav">',
                '       <ul class="edit-toolbar-left" />',
                '       <ul class="edit-toolbar-right" />',
                '   </nav>',
                '</div>'
            ].join('')
        },


        /**
         * triggered when edit-toolbar is initialized and ready to use
         *
         * @event husky.edit-toolbar.[INSTANCE_NAME.]initialized
         */
        INITIALIZED = function() {
            return createEventName.call(this, 'initialized');
        },

        /**
         * enable a button
         *
         * @event husky.edit-toolbar.[INSTANCE_NAME.]item.enable
         * @param {string} id The id of the button which should be enabled
         */
        ITEM_ENABLE = function() {
            return createEventName.call(this, 'item.enable');
        },

        /**
         * disable a button
         *
         * @event husky.edit-toolbar.[INSTANCE_NAME.]item.disable
         * @param {string} id The id of the button which should be disabled
         */
        ITEM_DISABLE = function() {
            return createEventName.call(this, 'item.disable');
        },

        /**
         * event to set button into loading state
         *
         * @event husky.edit-toolbar.[INSTANCE_NAME.]item.loading
         * @param {string} id The id of the button
         */
        ITEM_LOADING = function() {
            return createEventName.call(this, 'item.loading');
        },

        /** events bound to dom */
        bindDOMEvents = function() {
            this.sandbox.dom.on(this.options.el, 'click', toggleItem.bind(this), '.dropdown-toggle');
            this.sandbox.dom.on(this.options.el, 'click', selectItem.bind(this), 'li');
        },

        /** events bound to sandbox */
        bindCustomEvents = function() {
            this.sandbox.on(ITEM_DISABLE.call(this), function(id, highlight) {
                toggleEnabled.call(this, false, id, highlight);
            }.bind(this));
            this.sandbox.on(ITEM_ENABLE.call(this), function(id, highlight) {
                toggleEnabled.call(this, true, id, highlight);
            }.bind(this));
            this.sandbox.on(ITEM_LOADING.call(this), function(id) {
                itemLoading.call(this, id);
            }.bind(this));
        },

        /** set item enable or disable */
        toggleEnabled = function(enabled, id, highlight) {
            var item = this.items[id],
                $item = this.sandbox.dom.find('[data-id="' + id + '"]', this.$el),
                $iconItem = this.sandbox.dom.find('[data-id="' + id + '"] .icon', this.$el),
                $itemLink,
                enabledIconClass = createIconClass.call(this, item, true),
                disabledIconClass = createIconClass.call(this, item, false);

            this.items[id].disabled = !enabled;

            // in case of item has state loading, restore original state
            if (item.loading) {
                item.loading = false;
                $itemLink = this.sandbox.dom.find('a', $item);
                this.sandbox.dom.remove(this.sandbox.dom.find('.item-loader', $item));
                this.sandbox.dom.show($itemLink);
            }

            if (highlight !== false) {
                // add color fading effect
                this.sandbox.dom.addClass($item, 'highlight-animation');

                // remove class after effect has finished
                this.sandbox.dom.on($item,'animationend webkitAnimationEnd oanimationend MSAnimationEnd', function(ev) {
                    this.sandbox.dom.removeClass(ev.currentTarget, 'highlight-animation');
                }.bind(this));
            }

            if (!!enabled) {
                this.sandbox.dom.removeClass($item, 'disabled');
                this.sandbox.dom.removeClass($iconItem, disabledIconClass);
                this.sandbox.dom.prependClass($iconItem, enabledIconClass);
            } else {
                this.sandbox.dom.addClass($item, 'disabled');
                this.sandbox.dom.removeClass($iconItem, enabledIconClass);
                this.sandbox.dom.prependClass($iconItem, disabledIconClass);
            }
        },

        /** shows loader at some icon */
        itemLoading = function(id) {
            var item = this.items[id],
                $item = this.sandbox.dom.find('[data-id="' + id + '"]', this.$el),
                $itemLink = this.sandbox.dom.find('a', $item),
                $loader;

            if (item.loading) {
                return;
            }

            item.loading = true;
            this.sandbox.dom.hide($itemLink);

            $loader = this.sandbox.dom.createElement('<span class="item-loader"></span>');
            this.sandbox.dom.append($item, $loader);

            this.sandbox.start([{
                name: 'loader@husky',
                options: {
                    el: $loader,
                    size: '30px',
                    color: 'white'
                }
            }]);
        },


        /**
         * gets called when toggle item is clicked
         * opens dropdown submenu
         * @param event
         */
        toggleItem = function(event) {

            event.preventDefault();
            event.stopPropagation();

            var $list = this.sandbox.dom.parent(event.currentTarget),
                id = this.sandbox.dom.data($list, 'id'),
                item = this.items[id],
                visible;

            if (!item || !item.disabled) {
                if (this.sandbox.dom.hasClass($list, 'is-expanded')) {
                    visible = true;
                }
                hideDropdowns.call(this);

                if (!visible) {
                    this.sandbox.dom.addClass($list, 'is-expanded');

                    // TODO: check if dropdown overlaps screen: set ul to .right-aligned

                    // on every click remove sub-menu
                    this.sandbox.dom.one('body', 'click', hideDropdowns.bind(this));
                }
            }
        },

        /**
         * hides dropdowns of this instance
         */
        hideDropdowns = function() {
            this.sandbox.dom.removeClass(this.sandbox.dom.find('.is-expanded', this.$el), 'is-expanded');
        },

        /**
         * when an element gets selected
         * gets item from items array and delegates to triggerSelectEvent function
         * @param event
         */
        selectItem = function(event) {

            event.preventDefault();

            var item = this.items[this.sandbox.dom.data(event.currentTarget, 'id')],
                $parent = this.sandbox.dom.parents(event.currentTarget, 'li').eq(0);

            // stop if item has subitems
            if ((item.items && item.items.length > 0) || item.loading) {
                return;
            }

            if (!item.disabled) {
                triggerSelectEvent.call(this, item, $parent);
            }
        },

        /**
         * either calls items callback (if set) or triggers select event
         * @param item
         * @param $parent
         */
        triggerSelectEvent = function(item, $parent) {

            var parentItem;

            // check if has parent and type of parent
            if (item.parentId) {
                parentItem = this.items[item.parentId];
                if (!!parentItem.type && parentItem.type === "select") {
                    changeMainListItem.call(this, $parent, item);
                }
            }

            // if callback is set call it, else trigger event
            if (item.callback) {
                item.callback();
            } else {
                emitEvent.call(this, 'item.select', item);
            }
        },

        /**
         * changes the list items icon and title
         * @param listElement
         * @param item
         */
        changeMainListItem = function(listElement, item) {

            // TODO: do not change size of element on change title
            // first get title
            var listItems = this.sandbox.dom.find('span', listElement);
            if (!!item.icon) {
                this.sandbox.dom.removeClass(listItems.eq(0), '');
                if (item.icon !== false) {
                    this.sandbox.dom.addClass(listItems.eq(0), createIconSupportClass.call(this, item, !item.disabled));
                }
            }
            if (!!item.title) {
                this.sandbox.dom.html(listItems.eq(1), item.title);
            }
        },

        /**
         * creates the class string of an icon
         * @param item
         * @param enabled
         * @returns {string}
         */
        createIconSupportClass = function(item, enabled) {
            var classArray,
                classString = '',
                icon = createIconClass.call(this, item, enabled);

            // create icon class
            if (item.icon) {
                classArray = [];
                classArray.push(icon);
                classArray.push('icon');
                if (item.iconSize) {
                    classArray.push(item.iconSize);
                }

                classString = classArray.join(' ');
            }

            return classString;
        },

        /**
         * returns valid class for item and state
         * @param item
         * @param enabled
         */
        createIconClass = function(item, enabled) {
            if (enabled === undefined) {
                enabled = true;
            }
            var icon = (!!enabled ? item.icon : !!item.disabledIcon ? item.disabledIcon : item.icon);
            return 'icon-' + icon;
        },

        /**
         * created dropdown menu
         * @param listItem
         * @param parent
         */
        createDropdownMenu = function(listItem, parent) {
            var $list = this.sandbox.dom.createElement('<ul class="edit-toolbar-dropdown-menu" />'),
                classString = '';
            this.sandbox.dom.append(listItem, $list);
            this.sandbox.util.foreach(parent.items, function(item) {

                if (item.divider) {
                    this.sandbox.dom.append($list, '<li class="divider"></li>');
                    return;
                }

                item.parentId = parent.id;
                // check id for uniqueness
                checkItemId.call(this, item);
                this.items[item.id] = item;

                if (item.disabled) {
                    classString = ' class="disabled"';
                }

                this.sandbox.dom.append($list, '<li data-id="' + item.id + '"' + classString + '><a href="#">' + item.title + '</a></li>');
            }.bind(this));
        },

        /**
         * function checks if id is set and unique among all items
         * otherwise a new id is generated for the element
         * @param item
         */
        checkItemId = function(item) {
            // if item has no id, generate random id
            if (!item.id || !!this.items[item.id]) {
                do {
                    item.id = this.sandbox.util.uniqueId();
                } while (!!this.items[item.id]);
            }
            // set enabled defaults
            if (!item.disabled) {
                item.disabled = false;
            }
        },

        /** emits event */
        emitEvent = function(postFix, data) {
            var eventName = createEventName.call(this, postFix);
            if (!!data) {
                this.sandbox.emit(eventName, data);
            } else {
                this.sandbox.emit(eventName);
            }
        },

        /** returns normalized event names */
        createEventName = function(postFix) {
            return 'husky.edit-toolbar.' + (this.options.instanceName ? this.options.instanceName + '.' : '') + postFix;
        };

    return {

        view: true,


        /**
         * initialize component
         */
        initialize: function() {

            this.options = this.sandbox.util.extend(true, {}, defaults, this.options);

            // load data and call render
            if (!!this.options.url) {
                this.sandbox.util.load(this.options.url)
                    .then(this.render.bind(this))
                    .fail(function(data) {
                        this.sandbox.logger.log('data could not be loaded:', data);
                    }.bind(this));
            } else if (!!this.options.data) {
                this.render((this.options.data));
            } else {
                this.sandbox.logger.log('no data provided for tabs!');
            }

            bindDOMEvents.call(this);
            bindCustomEvents.call(this);
        },

        /**
         * renders the toolbar
         * @param {Object} data t
         */
        render: function(data) {

            var classArray, addTo, $left, $right,
                $listItem, $listLink,
                title;

            // create navbar skeleton
            this.sandbox.dom.append(this.options.el, templates.skeleton);

            $left = this.sandbox.dom.find('.edit-toolbar-left', this.options.el);
            $right = this.sandbox.dom.find('.edit-toolbar-right', this.options.el);

            // create items array
            this.items = [];
            // save item groups in array
            this.itemGroup = [];


            // create all elements
            this.sandbox.util.foreach(data, function(item) {

                // check id for uniqueness
                checkItemId.call(this, item);

                // save to items array
                this.items[item.id] = item;

                // create class array
                classArray = ['edit-toolbar-item'];
                if (!!item['class']) {
                    classArray.push(item['class']);
                }
                if (item.disabled) {
                    classArray.push('disabled');
                }

                // if group is set to right, add to right list, otherwise always add to left list
                if (!!item.group && item.group === 'right') {
                    addTo = $right;
                } else {
                    addTo = $left;
                }

                $listItem = this.sandbox.dom.createElement('<li class="' + classArray.join(' ') + '" data-id="' + item.id + '"/>');
                $listLink = this.sandbox.dom.createElement('<a href="#" />');
                this.sandbox.dom.append($listItem, $listLink);

                // create icon span
                this.sandbox.dom.append($listLink, '<span class="' + createIconSupportClass.call(this, item, !item.disabled) + '" />');

                // create title span
                title = item.title ? item.title : '';
                this.sandbox.dom.append($listLink, '<span class="title">' + title + '</span>');


                // now create subitems
                if (!!item.items) {
                    this.sandbox.dom.addClass($listLink, 'dropdown-toggle');
                    createDropdownMenu.call(this, $listItem, item);
                }

                // create button
                this.sandbox.dom.append(addTo, $listItem);

            }.bind(this));

            // initialization finished
            this.sandbox.emit(INITIALIZED.call(this));
        }
    };

});
