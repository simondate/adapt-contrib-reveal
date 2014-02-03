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
                'touchstart .reveal-widget-control':'clickReveal',
                'inview' : 'inview'
            }:{
                'click .reveal-widget-control':'clickReveal',
                'inview' : 'inview'
            }
        },

        preRender: function() {
            this.listenTo(Adapt, 'pageView:ready', this.setupReveal, this);
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

            this.setDeviceSize();
        },

        setupReveal: function() {
            var direction = !this.model.get('_direction') ? "left" : this.model.get('_direction');

            // Initialise the directional arrows
            this.$('.reveal-widget-item').addClass('reveal-' + this.model.get('_direction'));
            this.$('.reveal-widget-control').addClass('reveal-' + direction);
            this.$('.reveal-widget-icon').addClass('icon-arrow-' + this.getOppositeDirection(direction));

            this.model.set('_direction', direction);
            this.model.set('_active', true);
            this.model.set('_revealed', false);

            this.setControlText(false);

            this.calculateWidths();
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

            this.$('.reveal-widget-slider').css('width', 2 * imageWidth);
            
            if (this.model.get('_revealed')) {
                this.$('.reveal-widget-control').css(this.model.get('_direction'), imageWidth - controlWidth)
            }

            this.$('.reveal-widget-slider').css('margin-' + direction, margin);

            this.model.set('_scrollWidth', imageWidth);
            this.model.set('_controlWidth', controlWidth);
        },

        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.$el.addClass('desktop').removeClass('mobile');
                this.model.set('_isDesktop', true);
            } else {
                this.$el.addClass('mobile').removeClass('desktop');
                this.model.set('_isDesktop', false)
            }
        },

        resizeControl: function() {           
            var imageWidth = this.$('.reveal-widget').width();
            var controlWidth = this.$('.reveal-widget-control').width();
            var direction = this.model.get('_direction');


            if (this.model.get('_revealed')) {
                this.$('.reveal-widget-control').css(direction, imageWidth - controlWidth);
                this.$('.reveal-widget-slider').css('margin-left', (direction == 'left') ? 0 : - imageWidth);
            } else {
                this.$('.reveal-widget-slider').css('margin-left', (direction == 'left') ? imageWidth : 0);
            }

            this.$('.reveal-widget-slider').css('width', 2 * imageWidth);
            this.$('.reveal-widget-slider').css('margin-' + direction, -imageWidth);            

            this.model.set('_scrollWidth', imageWidth);
            this.model.set('_controlWidth', controlWidth);
        },

        postRender: function () {
            this.$('.reveal-widget').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));
        },
        
        getOppositeDirection: function(direction) {
            switch(direction) {
                case 'left':
                    oppositeDirection = 'right';
                    break;
                case 'right':
                    oppositeDirection = 'left';
                    break;
            }

            return oppositeDirection;
        },

        clickReveal: function (event) {
            event.preventDefault();

            var direction = this.model.get('_direction');
            var scrollWidth = this.model.get('_scrollWidth');
            var controlWidth = this.model.get('_controlWidth');
            var controlMovement = (!this.model.get('_revealed')) ? scrollWidth - controlWidth : scrollWidth; 
            var operator = !this.model.get('_revealed') ? '+=' : '-=';
            var controlAnimation = {}, sliderAnimation = {};
            
            // Define the animations and new icon styles
            if (!this.model.get('_revealed')) {
                this.model.set('_revealed', true);
                this.$('.reveal-widget').addClass('reveal-showing');

                controlAnimation[direction] = operator + controlMovement;
                classToAdd = 'icon-arrow-' + direction; 
                classToRemove = 'icon-arrow-' + this.getOppositeDirection(direction);

                sliderAnimation['margin-left'] = (direction == 'left') ? 0 : -scrollWidth;

                this.setCompletionStatus();
            } else {
                this.model.set('_revealed', false);
                this.$('.reveal-widget').removeClass('reveal-showing');

                controlAnimation[direction] = 0;
                classToAdd = 'icon-arrow-' + this.getOppositeDirection(direction);
                classToRemove = 'icon-arrow-' + direction;

                sliderAnimation['margin-left'] = (direction == 'left') ? controlMovement : 0
            }

            // Change the UI to handle the new state
            this.$('.reveal-widget-slider').animate(sliderAnimation);
            this.$('.reveal-widget-control').animate(controlAnimation);
            this.$('.reveal-widget-icon').removeClass(classToRemove).addClass(classToAdd);

            this.setControlText(this.model.get('_revealed'));
        }
    });
    
    Adapt.register("reveal", Reveal);
    
    return Reveal;
});