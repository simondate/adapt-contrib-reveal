/*
* adapt-contrib-reveal
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define(function(require) {

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");

    var Reveal = ComponentView.extend({

        events: function () {
            return Adapt.device.touch == true ? {
                'touchstart .reveal-widget-control':  'clickReveal',
                'click .reveal-widget-control':       'clickReveal',
                'inview':                             'inview',
                'touchstart .reveal-popup-open':      'openPopup'
            } : {
                'click .reveal-widget-control':       'clickReveal',
                'inview':                             'inview',
                'click .reveal-popup-open' :          'openPopup'
            }
        },

        preRender: function() {
            this.listenTo(Adapt, 'pageView:ready', this.setupReveal, this);
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);
            this.listenTo(Adapt, 'device:changed', this.setDeviceSize, this);

            this.setDeviceSize();
        },

        setupReveal: function() {
            var direction = !this.model.get('_direction') ? "left" : this.model.get('_direction');
            var iconDirection = this.getIconDirection(direction);

            // Initialise the directional arrows
            this.$('.reveal-widget-item').addClass('reveal-' + this.model.get('_direction'));
            this.$('.reveal-widget-control').addClass('reveal-' + direction);
            this.$('.reveal-image').addClass('reveal-' + direction);
            this.$('div.reveal-widget-item-text').addClass('reveal-' + direction);

            this.$('div.reveal-widget-item-text-body').addClass('reveal-' + direction);
            this.$('.reveal-widget-icon').addClass('icon-controls-' + this.getOppositeDirection(iconDirection));

            this.model.set('_direction', direction);
            this.model.set('_active', true);
            this.model.set('_revealed', false);

            this.setControlText(false);

            if (this.isHorizontal(direction)) {
                this.calculateWidths();
            } else {
                this.calculateHeights();
            }
        },

        isHorizontal: function(direction) {
            return (direction == 'left' || direction == 'right');
        },

        isVertical: function(direction) {
            return (direction == 'top' || direction == 'bottom');
        },

        setControlText: function(isRevealed) {
            if (this.model.get('_control')) {
                if (!isRevealed && this.model.get('control').showText) {
                    this.$('.reveal-widget-control').attr('title', this.model.get('control').showText);
                }

                if (isRevealed && this.model.get('control').hideText) {
                    this.$('.reveal-widget-control').attr('title', this.model.get('control').hideText);
                }
            }
        },

        calculateWidths: function() {
            var direction = this.model.get('_direction');
            var imageWidth = this.$('.reveal-widget').width();
            var controlWidth = this.$('.reveal-widget-control').width();
            var margin = -imageWidth;

            this.$('.reveal-widget-slider').css('width', imageWidth * 2);

            if (this.model.get('_revealed')) {
                this.$('.reveal-widget-control').css(this.model.get('_direction'), imageWidth - controlWidth)
            }

            this.$('.reveal-widget-slider').css('margin-' + direction, margin);
            // Ensure the text doesn't overflow the image
            this.$('div.reveal-widget-item-text').css('width', ($('img.reveal-image').width() - 80));
            this.model.set('_scrollWidth', imageWidth);
            this.model.set('_controlWidth', controlWidth);
        },

        calculateHeights: function() {
            var direction = this.model.get('_direction');
            var imageHeight = this.$('.reveal-widget').height();
            var controlHeight = this.$('.reveal-widget-control').height();
            var margin;
            
            if (!this.model.get('_revealed')) {
                margin = -imageHeight / 2;
            } else {
                margin = -imageHeight;
            }

            this.$('.reveal-widget').css('height', imageHeight / 2);
            this.$('.reveal-widget-slider').css('height', imageHeight);

            if (this.model.get('_revealed')) {
              this.$('.reveal-widget-control').css(this.model.get('_direction'), imageHeight - controlHeight)
            }

            this.$('.reveal-widget-slider').css('margin-' + direction, margin);
            // Ensure the text doesn't overflow the image
            this.$('div.reveal-widget-item-text').css('height', ($('img.reveal-image').height() - 80));
            this.model.set('_scrollWidth', imageHeight / 2);
            this.model.set('_controlWidth', controlHeight);
        },

        getOrientation: function(direction) {
            if (this.isHorizontal(direction)) {
                return 'left';
            } else {
                return 'top';
            }
        },

        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.$el.addClass('desktop').removeClass('mobile');
                this.model.set('_isDesktop', true);
            } else {
                this.$el.addClass('mobile').removeClass('desktop');
                this.model.set('_isDesktop', false);
            }

            // On mobile, Check for items with long text. We'll provide a popup for these
            var CHAR_LIMIT = 50;
            var first = this.model.get('first');
            var second = this.model.get('second');

            if (typeof first === 'undefined' || typeof second === 'undefined') {
                return false;
            }

            var firstCharLimit = first._maxCharacters || CHAR_LIMIT;
            var secondCharLimit = second._maxCharacters || CHAR_LIMIT;
            var firstHasPopup = first.body && first.body.length > firstCharLimit;
            var secondHasPopup = second.body && second.body.length > secondCharLimit;

            if (firstHasPopup) {
                if (first.body) {
                    this.model.set('_firstShortText', $(first.body).text().substring(0, firstCharLimit) + '...');
                }
            }
            if (secondHasPopup) {
                if (second.body) {
                    this.model.set('_secondShortText', $(second.body).text().substring(0, secondCharLimit) + '...');
                }
            }
            if (Adapt.device.screenSize != 'large') {
                this.model.set('_displayFirstShortText', firstHasPopup);
                this.model.set('_displaySecondShortText', secondHasPopup);
                if (firstHasPopup) {
                    this.$('.reveal-first-short').removeClass('reveal-hidden');
                    this.$('.reveal-first-long').addClass('reveal-hidden');
                }
                if (secondHasPopup) {
                    this.$('.reveal-second-short').removeClass('reveal-hidden');
                    this.$('.reveal-second-long').addClass('reveal-hidden');
                }
            } else {
                this.model.set('_displayFirstShortText', false);
                this.model.set('_displaySecondShortText', false);
                this.$('.reveal-first-short').addClass('reveal-hidden');
                this.$('.reveal-first-long').removeClass('reveal-hidden');
                this.$('.reveal-second-short').addClass('reveal-hidden');
                this.$('.reveal-second-long').removeClass('reveal-hidden');
            }
        },

        resizeControl: function() {
            var direction = this.model.get('_direction');
            var orientation = this.getOrientation(direction);
            var imageSize;
            var controlSize;

            if (this.isHorizontal(direction)) {
                imageSize = this.$('.reveal-widget').width();
                controlSize = this.$('.reveal-widget-control').width();
            } else {
                imageSize = this.$('.reveal-widget').height();
                controlSize = this.$('.reveal-widget-control').height();
            }

            var sliderAnimation = {};

            if (this.model.get('_revealed')) {
                this.$('.reveal-widget-slider').css('margin-' + orientation, (direction == orientation) ? -imageSize : 0);
                sliderAnimation['margin-' + orientation] = (direction == orientation) ? 0 :  -imageSize
                this.$('.reveal-widget-slider').animate(sliderAnimation);
            } else {
                this.$('.reveal-widget-slider').css('margin-' + orientation, (direction == orientation) ? imageSize : 0);
            }

            this.$('.reveal-widget-slider').css('width', 2 * imageSize);
            this.$('.reveal-widget-slider').css('margin-' + direction, -imageSize);
            this.model.set('_scrollWidth', imageSize);
            this.model.set('_controlWidth', controlSize);
        },

        postRender: function () {
            this.$('.reveal-widget').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));
        },

        getOppositeDirection: function(direction) {
            if (this.isHorizontal(direction)) {
                return (direction == 'left') ? 'right' : 'left';
            } else if (this.isVertical(direction)) {
                return (direction == 'top') ? 'bottom' : 'top';
            } else {
                return (direction == 'up') ? 'down' : 'up';
            }
        },

        getIconDirection: function(direction) {
            if (this.isVertical(direction)) {
                return (direction == 'top') ? 'up' : 'down';
            } else {
                return direction;
            }
        },

        clickReveal: function (event) {
            event.preventDefault();

            var direction = this.model.get('_direction');
            var orientation = this.getOrientation(direction);
            var scrollWidth = this.model.get('_scrollWidth');
            var controlWidth = this.model.get('_controlWidth');
            var controlMovement = (!this.model.get('_revealed')) ? scrollWidth - controlWidth : scrollWidth;
            var operator = !this.model.get('_revealed') ? '+=' : '-=';
            var iconDirection = this.getIconDirection(direction);
            var controlAnimation = {};
            var sliderAnimation = {};
            var classToAdd;
            var classToRemove;

            // Define the animations and new icon styles
            if (!this.model.get('_revealed')) {
                // reveal second
                this.model.set('_revealed', true);
                this.$('.reveal-widget').addClass('reveal-showing');

                controlAnimation[direction] = operator + controlMovement;
                classToAdd = 'icon-controls-' + iconDirection;
                classToRemove = 'icon-controls-' + this.getOppositeDirection(iconDirection);

                sliderAnimation['margin-' + orientation] = (direction == orientation) ? 0 : -scrollWidth;

                this.setCompletionStatus();
            } else {
                //show first
                this.model.set('_revealed', false);
                this.$('.reveal-widget').removeClass('reveal-showing');

                controlAnimation[direction] = 0;
                classToAdd = 'icon-controls-' + this.getOppositeDirection(iconDirection);
                classToRemove = 'icon-controls-' + iconDirection
                
                sliderAnimation['margin-' + orientation] = (direction == orientation) ? operator + controlMovement : 0;
            }
            // Change the UI to handle the new state
            this.$('.reveal-widget-slider').animate(sliderAnimation);
            this.$('.reveal-widget-icon').removeClass(classToRemove).addClass(classToAdd);

            this.setControlText(this.model.get('_revealed'));
        },

        openPopup: function (event) {
            event.preventDefault();

            this.model.set('_active', false);

            var bodyText = this.model.get('_revealed')
              ? this.model.get('second').body
              : this.model.get('first').body;

            var popupObject = {
                title: '',
                body: bodyText
            };

            Adapt.trigger('notify:popup', popupObject);
      }
    });

    Adapt.register("reveal", Reveal);

    return Reveal;
});
