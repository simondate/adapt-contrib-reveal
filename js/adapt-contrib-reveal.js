/*
* adapt-contrib-reveal
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define(function(require) {
    'use strict';

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");
    var dotdotdot = require("components/adapt-contrib-reveal/js/jquery.dotdotdot.min.js");

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

        orientationStates: {
            Vertical: 'vertical',
            Horizontal: 'horizontal'
        },

        preRender: function() {
            var orientation;
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

            switch (this.model.get('_direction')) {
                case 'left':
                case 'right':
                    orientation = this.orientationStates.Horizontal;
                    break;
                case 'top':
                case 'bottom':
                    orientation = this.orientationStates.Vertical;
            }

            this.model.set('_orientation', orientation);
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

            // Change accessibility tab index on page load. 
            this.$('.second .reveal-widget-item-text-body .accessible-text-block').attr('tabindex', '-1');

            this.model.set('_direction', direction);
            this.model.set('_active', true);
            this.model.set('_revealed', false);

            this.setControlText(false);

            // Reverse reveal item order for the reveal bottom component.
            if (direction == "bottom") {
                $(this.$('.reveal-widget-item-text.first.reveal-bottom').parent()).insertBefore(this.$('.reveal-widget-item-text.second.reveal-bottom').parent());
            }

            if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
                this.calculateWidths();
            } else {
                this.calculateHeights();
            }

            // Call jQuery dotdotdot to control reveal text responsively 
            this.$('.reveal-widget-item-text-body').dotdotdot({ watch: "window" });
            this.ellipsisControl();
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
            var $widget = this.$('.reveal-widget');
            var $slider = this.$('.reveal-widget-slider');
            var $control = this.$('.reveal-widget-control');

            var imageWidth = $widget.width();
            var controlWidth = $control.width();
            var margin = -imageWidth;

            $slider.css('width', imageWidth * 2);

            if (this.model.get('_revealed')) {
                $control.css(this.model.get('_direction'), imageWidth - controlWidth);
            }

            $slider.css('margin-' + direction, margin);

            // Ensure the text doesn't overflow the image
            this.$('div.reveal-widget-item-text').css('width', ($('img.reveal-image').width() - 80));
            
            this.model.set('_scrollSize', imageWidth);
            this.model.set('_controlWidth', controlWidth);
        },

        calculateHeights: function() {
            var direction = this.model.get('_direction');

            // Cache the JQuery objects
            var $widget = this.$('.reveal-widget');
            var $image = this.$('.reveal-widget img');
            var $slider = this.$('.reveal-widget-slider');
            var $control = this.$('.reveal-widget-control');
            var imageHeight = $image.height();
            var controlHeight = $control.height();
            var margin = direction == "top" ? -imageHeight : imageHeight;

            $widget.css('height', imageHeight);
            $slider.css('height', imageHeight);

            if (this.model.get('_revealed')) {
               $control.css(this.model.get('_direction'), imageHeight - controlHeight);
            }

            if (direction == 'bottom') {
                $slider.css('margin-top', 0);
            } else {
                $slider.css('margin-' + direction, margin);
            }

            // Ensure the text doesn't overflow the image
            this.$('div.reveal-widget-item-text').css("height", imageHeight);

            this.model.set('_scrollSize', imageHeight);
            this.model.set('_controlWidth', controlHeight);
        },

        getMarginType: function() {
            return this.model.get('_orientation') == this.orientationStates.Horizontal ? 'left' : 'top';
        },

        // Show or Hide full reveal text dialog control.
        ellipsisControl: function() {
            var revealContainers = ['.reveal-first-long', '.reveal-second-long']

            $.each( revealContainers, function(index, reveal) { 
                var isTruncated = $('.reveal-widget-item-text-body' + reveal).triggerHandler("isTruncated");
                
                if ( isTruncated ) {
                    $(reveal).parent().find(".reveal-link-text").removeClass('reveal-hidden');
                } else {
                    if (!$(reveal).parent().find(".reveal-link-text").hasClass('reveal-hidden')) {
                        $(reveal).parent().find(".reveal-link-text").addClass('reveal-hidden');
                    }
                }
            });

        },
        
        resizeControl: function() {
            var direction = this.model.get('_direction');
            var marginType = this.getMarginType();
            var $widget = this.$('.reveal-widget');
            var $slider = this.$('.reveal-widget-slider');
            var imageSize;
            var controlSize;
            
            if (this.model.get('_orientation') == this.orientationStates.Horizontal) {
                imageSize = $widget.width();
                controlSize = this.$('.reveal-widget-control').width();
                $widget.css('width', imageSize);
                $slider.css('width',  imageSize * 2);
            } else {
                imageSize = this.$('.reveal-widget img').height();
                controlSize = this.$('.reveal-widget-control').height();
                $widget.css('height', imageSize);
                $slider.css('height',  imageSize);
            }

            if (direction == 'bottom') {
                $slider.css('margin-top', -imageSize);
            } else {
                $slider.css('margin-' + direction, -imageSize);
            }         

            var sliderAnimation = {};

            if (this.model.get('_revealed')) {
                $slider.css('margin-' + marginType, (direction == marginType) ? -imageSize : 0);
                sliderAnimation['margin-' + marginType] = (direction == marginType) ? 0 :  -imageSize
                $slider.animate(sliderAnimation);
            } else {
                $slider.css('margin-' + marginType, (direction == marginType) ? imageSize : 0);
            }

            
            this.model.set('_scrollSize', imageSize);
            this.model.set('_controlWidth', controlSize);
            this.ellipsisControl();
        },

        postRender: function () {
            this.$('.reveal-widget').imageready(_.bind(function() {
                // IE hack - IE10/11 doesnt play nice with image sizes but it works on IE 9 which is nice. Because the universe doesnt make sense.
                if ($('html').hasClass('ie version-10.0') || $('html').hasClass('ie version-11.0')) {

                    var self = this;
                    
                    _.delay(function() {
                        self.setupReveal();
                        self.setReadyStatus();
                    }, 400);

                } else {
                    this.setupReveal();
                    this.setReadyStatus();
                }
            }, this));
        },

        getOppositeDirection: function(direction) {
            var o = {
                'left': 'right',
                'right': 'left',
                'up': 'down',
                'down': 'up'
            };

            return o[direction];
        },

        getIconDirection: function(direction) {
            if (this.model.get('_orientation') == this.orientationStates.Vertical) {
                return (direction == 'top') ? 'up' : 'down';
            } else {
                return direction;
            }
        },

        clickReveal: function (event) {
            event.preventDefault();

            var direction = this.model.get('_direction');
            var marginType = this.getMarginType();
            var scrollSize = this.model.get('_scrollSize');
            var controlWidth = this.model.get('_controlWidth');
            var controlMovement = (!this.model.get('_revealed')) ? scrollSize - controlWidth : scrollSize;
            var operator = !this.model.get('_revealed') ? '+=' : '-=';
            var iconDirection = this.getIconDirection(direction);
            var controlAnimation = {};
            var sliderAnimation = {};
            var classToAdd;
            var classToRemove;

            // Clear all disabled accessibility settings 
            this.$('.reveal-widget-item-text-body').removeClass('a11y-ignore').removeAttr('aria-hidden').removeAttr('tab-index'); 

            // Define the animations and new icon styles
            if (!this.model.get('_revealed')) {
                // reveal second
                this.model.set('_revealed', true);
                this.$('.reveal-widget').addClass('reveal-showing');

                // Modify accessibility tab index and classes to prevent hidden elements from being read before visible elements.
                this.$('.first .reveal-widget-item-text-body').addClass('a11y-ignore').attr('aria-hidden', 'true').attr('tabindex', '-1');
                this.$('.second .reveal-widget-item-text-body .accessible-text-block').attr('tabindex', '0');
                this.$('.first .reveal-widget-item-text-body .accessible-text-block').attr('tabindex', '-1');

                controlAnimation[direction] = operator + controlMovement;
                classToAdd = 'icon-controls-' + iconDirection;
                classToRemove = 'icon-controls-' + this.getOppositeDirection(iconDirection);

                sliderAnimation['margin-' + marginType] = (direction == marginType) ? 0 : -scrollSize;

                this.setCompletionStatus();
            } else {
                //show first
                this.model.set('_revealed', false);
                this.$('.reveal-widget').removeClass('reveal-showing');

                // Modify accessibility tab index to prevent hidden elements from being read before visible elements.
                this.$('.second .reveal-widget-item-text-body').addClass('a11y-ignore').attr('aria-hidden', 'true').attr('tabindex', '-1');
                this.$('.first .reveal-widget-item-text-body .accessible-text-block').attr('tabindex', '0');
                this.$('.second .reveal-widget-item-text-body .accessible-text-block').attr('tabindex', '-1');

                controlAnimation[direction] = 0;
                classToAdd = 'icon-controls-' + this.getOppositeDirection(iconDirection);
                classToRemove = 'icon-controls-' + iconDirection

                sliderAnimation['margin-' + marginType] = (direction == marginType) ? operator + controlMovement : 0;
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
