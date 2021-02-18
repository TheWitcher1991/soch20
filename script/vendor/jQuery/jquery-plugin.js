/*
 * Lazy Load - jQuery plugin for lazy loading images
 *
 * Copyright (c) 2007-2013 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/lazyload
 *
 * Version:  1.9.3
 *
 */

(function($, window, document, undefined) {
    var $window = $(window);

    $.fn.lazyload = function(options) {
        var elements = this;
        var $container;
        var settings = {
            threshold       : 0,
            failure_limit   : 0,
            event           : "scroll",
            effect          : "show",
            container       : window,
            data_attribute  : "original",
            skip_invisible  : true,
            appear          : null,
            load            : null,
            placeholder     : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
        };

        function update() {
            var counter = 0;

            elements.each(function() {
                var $this = $(this);
                if (settings.skip_invisible && !$this.is(":visible")) {
                    return;
                }
                if ($.abovethetop(this, settings) ||
                    $.leftofbegin(this, settings)) {
                        /* Nothing. */
                } else if (!$.belowthefold(this, settings) &&
                    !$.rightoffold(this, settings)) {
                        $this.trigger("appear");
                        /* if we found an image we'll load, reset the counter */
                        counter = 0;
                } else {
                    if (++counter > settings.failure_limit) {
                        return false;
                    }
                }
            });

        }

        if(options) {
            /* Maintain BC for a couple of versions. */
            if (undefined !== options.failurelimit) {
                options.failure_limit = options.failurelimit;
                delete options.failurelimit;
            }
            if (undefined !== options.effectspeed) {
                options.effect_speed = options.effectspeed;
                delete options.effectspeed;
            }

            $.extend(settings, options);
        }

        /* Cache container as jQuery as object. */
        $container = (settings.container === undefined ||
                      settings.container === window) ? $window : $(settings.container);

        /* Fire one scroll event per scroll. Not one scroll event per image. */
        if (0 === settings.event.indexOf("scroll")) {
            $container.bind(settings.event, function() {
                return update();
            });
        }

        this.each(function() {
            var self = this;
            var $self = $(self);

            self.loaded = false;

            /* If no src attribute given use data:uri. */
            if ($self.attr("src") === undefined || $self.attr("src") === false) {
                if ($self.is("img")) {
                    $self.attr("src", settings.placeholder);
                }
            }

            /* When appear is triggered load original image. */
            $self.one("appear", function() {
                if (!this.loaded) {
                    if (settings.appear) {
                        var elements_left = elements.length;
                        settings.appear.call(self, elements_left, settings);
                    }
                    $("<img />")
                        .bind("load", function() {

                            var original = $self.attr("data-" + settings.data_attribute);
                            $self.hide();
                            if ($self.is("img")) {
                                $self.attr("src", original);
                            } else {
                                $self.css("background-image", "url('" + original + "')");
                            }
                            $self[settings.effect](settings.effect_speed);

                            self.loaded = true;

                            /* Remove image from array so it is not looped next time. */
                            var temp = $.grep(elements, function(element) {
                                return !element.loaded;
                            });
                            elements = $(temp);

                            if (settings.load) {
                                var elements_left = elements.length;
                                settings.load.call(self, elements_left, settings);
                            }
                        })
                        .attr("src", $self.attr("data-" + settings.data_attribute));
                }
            });

            /* When wanted event is triggered load original image */
            /* by triggering appear.                              */
            if (0 !== settings.event.indexOf("scroll")) {
                $self.bind(settings.event, function() {
                    if (!self.loaded) {
                        $self.trigger("appear");
                    }
                });
            }
        });

        /* Check if something appears when window is resized. */
        $window.bind("resize", function() {
            update();
        });

        /* With IOS5 force loading images when navigating with back button. */
        /* Non optimal workaround. */
        if ((/(?:iphone|ipod|ipad).*os 5/gi).test(navigator.appVersion)) {
            $window.bind("pageshow", function(event) {
                if (event.originalEvent && event.originalEvent.persisted) {
                    elements.each(function() {
                        $(this).trigger("appear");
                    });
                }
            });
        }

        /* Force initial check if images should appear. */
        $(document).ready(function() {
            update();
        });

        return this;
    };

    /* Convenience methods in jQuery namespace.           */
    /* Use as  $.belowthefold(element, {threshold : 100, container : window}) */

    $.belowthefold = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top + $(settings.container).height();
        }

        return fold <= $(element).offset().top - settings.threshold;
    };

    $.rightoffold = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.width() + $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left + $(settings.container).width();
        }

        return fold <= $(element).offset().left - settings.threshold;
    };

    $.abovethetop = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top;
        }

        return fold >= $(element).offset().top + settings.threshold  + $(element).height();
    };

    $.leftofbegin = function(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left;
        }

        return fold >= $(element).offset().left + settings.threshold + $(element).width();
    };

    $.inviewport = function(element, settings) {
         return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) &&
                !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
     };

    /* Custom selectors for your convenience.   */
    /* Use as $("img:below-the-fold").something() or */
    /* $("img").filter(":below-the-fold").something() which is faster */

    $.extend($.expr[":"], {
        "below-the-fold" : function(a) { return $.belowthefold(a, {threshold : 0}); },
        "above-the-top"  : function(a) { return !$.belowthefold(a, {threshold : 0}); },
        "right-of-screen": function(a) { return $.rightoffold(a, {threshold : 0}); },
        "left-of-screen" : function(a) { return !$.rightoffold(a, {threshold : 0}); },
        "in-viewport"    : function(a) { return $.inviewport(a, {threshold : 0}); },
        /* Maintain BC for couple of versions. */
        "above-the-fold" : function(a) { return !$.belowthefold(a, {threshold : 0}); },
        "right-of-fold"  : function(a) { return $.rightoffold(a, {threshold : 0}); },
        "left-of-fold"   : function(a) { return !$.rightoffold(a, {threshold : 0}); }
    });

})(jQuery, window, document);


/*!
	Colorbox 1.6.4
	license: MIT
	http://www.jacklmoore.com/colorbox
*/
(function ($, document, window) {
	var
	// Default settings object.
	// See http://jacklmoore.com/colorbox for details.
	defaults = {
		// data sources
		html: false,
		photo: false,
		iframe: false,
		inline: false,

		// behavior and appearance
		transition: "elastic",
		speed: 300,
		fadeOut: 300,
		width: false,
		initialWidth: "600",
		innerWidth: false,
		maxWidth: false,
		height: false,
		initialHeight: "450",
		innerHeight: false,
		maxHeight: false,
		scalePhotos: true,
		scrolling: true,
		opacity: 0.9,
		preloading: true,
		className: false,
		overlayClose: true,
		escKey: true,
		arrowKey: true,
		top: false,
		bottom: false,
		left: false,
		right: false,
		fixed: false,
		data: undefined,
		closeButton: true,
		fastIframe: true,
		open: false,
		reposition: true,
		loop: true,
		slideshow: false,
		slideshowAuto: true,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow",
		photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico|webp|jxr|svg)((#|\?).*)?$/i,

		// alternate image paths for high-res displays
		retinaImage: false,
		retinaUrl: false,
		retinaSuffix: '@2x.$1',

		// internationalization
		current: "image {current} of {total}",
		previous: "previous",
		next: "next",
		close: "close",
		xhrError: "This content failed to load.",
		imgError: "This image failed to load.",

		// accessbility
		returnFocus: true,
		trapFocus: true,

		// callbacks
		onOpen: false,
		onLoad: false,
		onComplete: false,
		onCleanup: false,
		onClosed: false,

		rel: function() {
			return this.rel;
		},
		href: function() {
			// using this.href would give the absolute url, when the href may have been inteded as a selector (e.g. '#container')
			return $(this).attr('href');
		},
		title: function() {
			return this.title;
		},
		createImg: function() {
			var img = new Image();
			var attrs = $(this).data('cbox-img-attrs');

			if (typeof attrs === 'object') {
				$.each(attrs, function(key, val){
					img[key] = val;
				});
			}

			return img;
		},
		createIframe: function() {
			var iframe = document.createElement('iframe');
			var attrs = $(this).data('cbox-iframe-attrs');

			if (typeof attrs === 'object') {
				$.each(attrs, function(key, val){
					iframe[key] = val;
				});
			}

			if ('frameBorder' in iframe) {
				iframe.frameBorder = 0;
			}
			if ('allowTransparency' in iframe) {
				iframe.allowTransparency = "true";
			}
			iframe.name = (new Date()).getTime(); // give the iframe a unique name to prevent caching
			iframe.allowFullscreen = true;

			return iframe;
		}
	},

	// Abstracting the HTML and event identifiers for easy rebranding
	colorbox = 'colorbox',
	prefix = 'cbox',
	boxElement = prefix + 'Element',

	// Events
	event_open = prefix + '_open',
	event_load = prefix + '_load',
	event_complete = prefix + '_complete',
	event_cleanup = prefix + '_cleanup',
	event_closed = prefix + '_closed',
	event_purge = prefix + '_purge',

	// Cached jQuery Object Variables
	$overlay,
	$box,
	$wrap,
	$content,
	$topBorder,
	$leftBorder,
	$rightBorder,
	$bottomBorder,
	$related,
	$window,
	$loaded,
	$loadingBay,
	$loadingOverlay,
	$title,
	$current,
	$slideshow,
	$next,
	$prev,
	$close,
	$groupControls,
	$events = $('<a/>'), // $({}) would be preferred, but there is an issue with jQuery 1.4.2

	// Variables for cached values or use across multiple functions
	settings,
	interfaceHeight,
	interfaceWidth,
	loadedHeight,
	loadedWidth,
	index,
	photo,
	open,
	active,
	closing,
	loadingTimer,
	publicMethod,
	div = "div",
	requests = 0,
	previousCSS = {},
	init;

	// ****************
	// HELPER FUNCTIONS
	// ****************

	// Convenience function for creating new jQuery objects
	function $tag(tag, id, css) {
		var element = document.createElement(tag);

		if (id) {
			element.id = prefix + id;
		}

		if (css) {
			element.style.cssText = css;
		}

		return $(element);
	}

	// Get the window height using innerHeight when available to avoid an issue with iOS
	// http://bugs.jquery.com/ticket/6724
	function winheight() {
		return window.innerHeight ? window.innerHeight : $(window).height();
	}

	function Settings(element, options) {
		if (options !== Object(options)) {
			options = {};
		}

		this.cache = {};
		this.el = element;

		this.value = function(key) {
			var dataAttr;

			if (this.cache[key] === undefined) {
				dataAttr = $(this.el).attr('data-cbox-'+key);

				if (dataAttr !== undefined) {
					this.cache[key] = dataAttr;
				} else if (options[key] !== undefined) {
					this.cache[key] = options[key];
				} else if (defaults[key] !== undefined) {
					this.cache[key] = defaults[key];
				}
			}

			return this.cache[key];
		};

		this.get = function(key) {
			var value = this.value(key);
			return $.isFunction(value) ? value.call(this.el, this) : value;
		};
	}

	// Determine the next and previous members in a group.
	function getIndex(increment) {
		var
		max = $related.length,
		newIndex = (index + increment) % max;

		return (newIndex < 0) ? max + newIndex : newIndex;
	}

	// Convert '%' and 'px' values to integers
	function setSize(size, dimension) {
		return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : winheight()) / 100) : 1) * parseInt(size, 10));
	}

	// Checks an href to see if it is a photo.
	// There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
	function isImage(settings, url) {
		return settings.get('photo') || settings.get('photoRegex').test(url);
	}

	function retinaUrl(settings, url) {
		return settings.get('retinaUrl') && window.devicePixelRatio > 1 ? url.replace(settings.get('photoRegex'), settings.get('retinaSuffix')) : url;
	}

	function trapFocus(e) {
		if ('contains' in $box[0] && !$box[0].contains(e.target) && e.target !== $overlay[0]) {
			e.stopPropagation();
			$box.focus();
		}
	}

	function setClass(str) {
		if (setClass.str !== str) {
			$box.add($overlay).removeClass(setClass.str).addClass(str);
			setClass.str = str;
		}
	}

	function getRelated(rel) {
		index = 0;

		if (rel && rel !== false && rel !== 'nofollow') {
			$related = $('.' + boxElement).filter(function () {
				var options = $.data(this, colorbox);
				var settings = new Settings(this, options);
				return (settings.get('rel') === rel);
			});
			index = $related.index(settings.el);

			// Check direct calls to Colorbox.
			if (index === -1) {
				$related = $related.add(settings.el);
				index = $related.length - 1;
			}
		} else {
			$related = $(settings.el);
		}
	}

	function trigger(event) {
		// for external use
		$(document).trigger(event);
		// for internal use
		$events.triggerHandler(event);
	}

	var slideshow = (function(){
		var active,
			className = prefix + "Slideshow_",
			click = "click." + prefix,
			timeOut;

		function clear () {
			clearTimeout(timeOut);
		}

		function set() {
			if (settings.get('loop') || $related[index + 1]) {
				clear();
				timeOut = setTimeout(publicMethod.next, settings.get('slideshowSpeed'));
			}
		}

		function start() {
			$slideshow
				.html(settings.get('slideshowStop'))
				.unbind(click)
				.one(click, stop);

			$events
				.bind(event_complete, set)
				.bind(event_load, clear);

			$box.removeClass(className + "off").addClass(className + "on");
		}

		function stop() {
			clear();

			$events
				.unbind(event_complete, set)
				.unbind(event_load, clear);

			$slideshow
				.html(settings.get('slideshowStart'))
				.unbind(click)
				.one(click, function () {
					publicMethod.next();
					start();
				});

			$box.removeClass(className + "on").addClass(className + "off");
		}

		function reset() {
			active = false;
			$slideshow.hide();
			clear();
			$events
				.unbind(event_complete, set)
				.unbind(event_load, clear);
			$box.removeClass(className + "off " + className + "on");
		}

		return function(){
			if (active) {
				if (!settings.get('slideshow')) {
					$events.unbind(event_cleanup, reset);
					reset();
				}
			} else {
				if (settings.get('slideshow') && $related[1]) {
					active = true;
					$events.one(event_cleanup, reset);
					if (settings.get('slideshowAuto')) {
						start();
					} else {
						stop();
					}
					$slideshow.show();
				}
			}
		};

	}());


	function launch(element) {
		var options;

		if (!closing) {

			options = $(element).data(colorbox);

			settings = new Settings(element, options);

			getRelated(settings.get('rel'));

			if (!open) {
				open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.

				setClass(settings.get('className'));

				// Show colorbox so the sizes can be calculated in older versions of jQuery
				$box.css({visibility:'hidden', display:'block', opacity:''});

				$loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden; visibility:hidden');
				$content.css({width:'', height:''}).append($loaded);

				// Cache values needed for size calculations
				interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();
				interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
				loadedHeight = $loaded.outerHeight(true);
				loadedWidth = $loaded.outerWidth(true);

				// Opens inital empty Colorbox prior to content being loaded.
				var initialWidth = setSize(settings.get('initialWidth'), 'x');
				var initialHeight = setSize(settings.get('initialHeight'), 'y');
				var maxWidth = settings.get('maxWidth');
				var maxHeight = settings.get('maxHeight');

				settings.w = Math.max((maxWidth !== false ? Math.min(initialWidth, setSize(maxWidth, 'x')) : initialWidth) - loadedWidth - interfaceWidth, 0);
				settings.h = Math.max((maxHeight !== false ? Math.min(initialHeight, setSize(maxHeight, 'y')) : initialHeight) - loadedHeight - interfaceHeight, 0);

				$loaded.css({width:'', height:settings.h});
				publicMethod.position();

				trigger(event_open);
				settings.get('onOpen');

				$groupControls.add($title).hide();

				$box.focus();

				if (settings.get('trapFocus')) {
					// Confine focus to the modal
					// Uses event capturing that is not supported in IE8-
					if (document.addEventListener) {

						document.addEventListener('focus', trapFocus, true);

						$events.one(event_closed, function () {
							document.removeEventListener('focus', trapFocus, true);
						});
					}
				}

				// Return focus on closing
				if (settings.get('returnFocus')) {
					$events.one(event_closed, function () {
						$(settings.el).focus();
					});
				}
			}

			var opacity = parseFloat(settings.get('opacity'));
			$overlay.css({
				opacity: opacity === opacity ? opacity : '',
				cursor: settings.get('overlayClose') ? 'pointer' : '',
				visibility: 'visible'
			}).show();

			if (settings.get('closeButton')) {
				$close.html(settings.get('close')).appendTo($content);
			} else {
				$close.appendTo('<div/>'); // replace with .detach() when dropping jQuery < 1.4
			}

			load();
		}
	}

	// Colorbox's markup needs to be added to the DOM prior to being called
	// so that the browser will go ahead and load the CSS background images.
	function appendHTML() {
		if (!$box) {
			init = false;
			$window = $(window);
			$box = $tag(div).attr({
				id: colorbox,
				'class': $.support.opacity === false ? prefix + 'IE' : '', // class for optional IE8 & lower targeted CSS.
				role: 'dialog',
				tabindex: '-1'
			}).hide();
			$overlay = $tag(div, "Overlay").hide();
			$loadingOverlay = $([$tag(div, "LoadingOverlay")[0],$tag(div, "LoadingGraphic")[0]]);
			$wrap = $tag(div, "Wrapper");
			$content = $tag(div, "Content").append(
				$title = $tag(div, "Title"),
				$current = $tag(div, "Current"),
				$prev = $('<button type="button"/>').attr({id:prefix+'Previous'}),
				$next = $('<button type="button"/>').attr({id:prefix+'Next'}),
				$slideshow = $('<button type="button"/>').attr({id:prefix+'Slideshow'}),
				$loadingOverlay
			);

			$close = $('<button type="button"/>').attr({id:prefix+'Close'});

			$wrap.append( // The 3x3 Grid that makes up Colorbox
				$tag(div).append(
					$tag(div, "TopLeft"),
					$topBorder = $tag(div, "TopCenter"),
					$tag(div, "TopRight")
				),
				$tag(div, false, 'clear:left').append(
					$leftBorder = $tag(div, "MiddleLeft"),
					$content,
					$rightBorder = $tag(div, "MiddleRight")
				),
				$tag(div, false, 'clear:left').append(
					$tag(div, "BottomLeft"),
					$bottomBorder = $tag(div, "BottomCenter"),
					$tag(div, "BottomRight")
				)
			).find('div div').css({'float': 'left'});

			$loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none; max-width:none;');

			$groupControls = $next.add($prev).add($current).add($slideshow);
		}
		if (document.body && !$box.parent().length) {
			$(document.body).append($overlay, $box.append($wrap, $loadingBay));
		}
	}

	// Add Colorbox's event bindings
	function addBindings() {
		function clickHandler(e) {
			// ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
			// See: http://jacklmoore.com/notes/click-events/
			if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				launch(this);
			}
		}

		if ($box) {
			if (!init) {
				init = true;

				// Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.
				$next.click(function () {
					publicMethod.next();
				});
				$prev.click(function () {
					publicMethod.prev();
				});
				$close.click(function () {
					publicMethod.close();
				});
				$overlay.click(function () {
					if (settings.get('overlayClose')) {
						publicMethod.close();
					}
				});

				// Key Bindings
				$(document).bind('keydown.' + prefix, function (e) {
					var key = e.keyCode;
					if (open && settings.get('escKey') && key === 27) {
						e.preventDefault();
						publicMethod.close();
					}
					if (open && settings.get('arrowKey') && $related[1] && !e.altKey) {
						if (key === 37) {
							e.preventDefault();
							$prev.click();
						} else if (key === 39) {
							e.preventDefault();
							$next.click();
						}
					}
				});

				if ($.isFunction($.fn.on)) {
					// For jQuery 1.7+
					$(document).on('click.'+prefix, '.'+boxElement, clickHandler);
				} else {
					// For jQuery 1.3.x -> 1.6.x
					// This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
					// This is not here for jQuery 1.9, it's here for legacy users.
					$('.'+boxElement).live('click.'+prefix, clickHandler);
				}
			}
			return true;
		}
		return false;
	}

	// Don't do anything if Colorbox already exists.
	if ($[colorbox]) {
		return;
	}

	// Append the HTML when the DOM loads
	$(appendHTML);


	// ****************
	// PUBLIC FUNCTIONS
	// Usage format: $.colorbox.close();
	// Usage from within an iframe: parent.jQuery.colorbox.close();
	// ****************

	publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
		var settings;
		var $obj = this;

		options = options || {};

		if ($.isFunction($obj)) { // assume a call to $.colorbox
			$obj = $('<a/>');
			options.open = true;
		}

		if (!$obj[0]) { // colorbox being applied to empty collection
			return $obj;
		}

		appendHTML();

		if (addBindings()) {

			if (callback) {
				options.onComplete = callback;
			}

			$obj.each(function () {
				var old = $.data(this, colorbox) || {};
				$.data(this, colorbox, $.extend(old, options));
			}).addClass(boxElement);

			settings = new Settings($obj[0], options);

			if (settings.get('open')) {
				launch($obj[0]);
			}
		}

		return $obj;
	};

	publicMethod.position = function (speed, loadedCallback) {
		var
		css,
		top = 0,
		left = 0,
		offset = $box.offset(),
		scrollTop,
		scrollLeft;

		$window.unbind('resize.' + prefix);

		// remove the modal so that it doesn't influence the document width/height
		$box.css({top: -9e4, left: -9e4});

		scrollTop = $window.scrollTop();
		scrollLeft = $window.scrollLeft();

		if (settings.get('fixed')) {
			offset.top -= scrollTop;
			offset.left -= scrollLeft;
			$box.css({position: 'fixed'});
		} else {
			top = scrollTop;
			left = scrollLeft;
			$box.css({position: 'absolute'});
		}

		// keeps the top and left positions within the browser's viewport.
		if (settings.get('right') !== false) {
			left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.get('right'), 'x'), 0);
		} else if (settings.get('left') !== false) {
			left += setSize(settings.get('left'), 'x');
		} else {
			left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
		}

		if (settings.get('bottom') !== false) {
			top += Math.max(winheight() - settings.h - loadedHeight - interfaceHeight - setSize(settings.get('bottom'), 'y'), 0);
		} else if (settings.get('top') !== false) {
			top += setSize(settings.get('top'), 'y');
		} else {
			top += Math.round(Math.max(winheight() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
		}

		$box.css({top: offset.top, left: offset.left, visibility:'visible'});

		// this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
		// but it has to be shrank down around the size of div#colorbox when it's done.  If not,
		// it can invoke an obscure IE bug when using iframes.
		$wrap[0].style.width = $wrap[0].style.height = "9999px";

		function modalDimensions() {
			$topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = (parseInt($box[0].style.width,10) - interfaceWidth)+'px';
			$content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = (parseInt($box[0].style.height,10) - interfaceHeight)+'px';
		}

		css = {width: settings.w + loadedWidth + interfaceWidth, height: settings.h + loadedHeight + interfaceHeight, top: top, left: left};

		// setting the speed to 0 if the content hasn't changed size or position
		if (speed) {
			var tempSpeed = 0;
			$.each(css, function(i){
				if (css[i] !== previousCSS[i]) {
					tempSpeed = speed;
					return;
				}
			});
			speed = tempSpeed;
		}

		previousCSS = css;

		if (!speed) {
			$box.css(css);
		}

		$box.dequeue().animate(css, {
			duration: speed || 0,
			complete: function () {
				modalDimensions();

				active = false;

				// shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
				$wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
				$wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";

				if (settings.get('reposition')) {
					setTimeout(function () {  // small delay before binding onresize due to an IE8 bug.
						$window.bind('resize.' + prefix, publicMethod.position);
					}, 1);
				}

				if ($.isFunction(loadedCallback)) {
					loadedCallback();
				}
			},
			step: modalDimensions
		});
	};

	publicMethod.resize = function (options) {
		var scrolltop;

		if (open) {
			options = options || {};

			if (options.width) {
				settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
			}

			if (options.innerWidth) {
				settings.w = setSize(options.innerWidth, 'x');
			}

			$loaded.css({width: settings.w});

			if (options.height) {
				settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
			}

			if (options.innerHeight) {
				settings.h = setSize(options.innerHeight, 'y');
			}

			if (!options.innerHeight && !options.height) {
				scrolltop = $loaded.scrollTop();
				$loaded.css({height: "auto"});
				settings.h = $loaded.height();
			}

			$loaded.css({height: settings.h});

			if(scrolltop) {
				$loaded.scrollTop(scrolltop);
			}

			publicMethod.position(settings.get('transition') === "none" ? 0 : settings.get('speed'));
		}
	};

	publicMethod.prep = function (object) {
		if (!open) {
			return;
		}

		var callback, speed = settings.get('transition') === "none" ? 0 : settings.get('speed');

		$loaded.remove();

		$loaded = $tag(div, 'LoadedContent').append(object);

		function getWidth() {
			settings.w = settings.w || $loaded.width();
			settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
			return settings.w;
		}
		function getHeight() {
			settings.h = settings.h || $loaded.height();
			settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
			return settings.h;
		}

		$loaded.hide()
		.appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
		.css({width: getWidth(), overflow: settings.get('scrolling') ? 'auto' : 'hidden'})
		.css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
		.prependTo($content);

		$loadingBay.hide();

		// floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.

		$(photo).css({'float': 'none'});

		setClass(settings.get('className'));

		callback = function () {
			var total = $related.length,
				iframe,
				complete;

			if (!open) {
				return;
			}

			function removeFilter() { // Needed for IE8 in versions of jQuery prior to 1.7.2
				if ($.support.opacity === false) {
					$box[0].style.removeAttribute('filter');
				}
			}

			complete = function () {
				clearTimeout(loadingTimer);
				$loadingOverlay.hide();
				trigger(event_complete);
				settings.get('onComplete');
			};


			$title.html(settings.get('title')).show();
			$loaded.show();

			if (total > 1) { // handle grouping
				if (typeof settings.get('current') === "string") {
					$current.html(settings.get('current').replace('{current}', index + 1).replace('{total}', total)).show();
				}

				$next[(settings.get('loop') || index < total - 1) ? "show" : "hide"]().html(settings.get('next'));
				$prev[(settings.get('loop') || index) ? "show" : "hide"]().html(settings.get('previous'));

				slideshow();

				// Preloads images within a rel group
				if (settings.get('preloading')) {
					$.each([getIndex(-1), getIndex(1)], function(){
						var img,
							i = $related[this],
							settings = new Settings(i, $.data(i, colorbox)),
							src = settings.get('href');

						if (src && isImage(settings, src)) {
							src = retinaUrl(settings, src);
							img = document.createElement('img');
							img.src = src;
						}
					});
				}
			} else {
				$groupControls.hide();
			}

			if (settings.get('iframe')) {

				iframe = settings.get('createIframe');

				if (!settings.get('scrolling')) {
					iframe.scrolling = "no";
				}

				$(iframe)
					.attr({
						src: settings.get('href'),
						'class': prefix + 'Iframe'
					})
					.one('load', complete)
					.appendTo($loaded);

				$events.one(event_purge, function () {
					iframe.src = "//about:blank";
				});

				if (settings.get('fastIframe')) {
					$(iframe).trigger('load');
				}
			} else {
				complete();
			}

			if (settings.get('transition') === 'fade') {
				$box.fadeTo(speed, 1, removeFilter);
			} else {
				removeFilter();
			}
		};

		if (settings.get('transition') === 'fade') {
			$box.fadeTo(speed, 0, function () {
				publicMethod.position(0, callback);
			});
		} else {
			publicMethod.position(speed, callback);
		}
	};

	function load () {
		var href, setResize, prep = publicMethod.prep, $inline, request = ++requests;

		active = true;

		photo = false;

		trigger(event_purge);
		trigger(event_load);
		settings.get('onLoad');

		settings.h = settings.get('height') ?
				setSize(settings.get('height'), 'y') - loadedHeight - interfaceHeight :
				settings.get('innerHeight') && setSize(settings.get('innerHeight'), 'y');

		settings.w = settings.get('width') ?
				setSize(settings.get('width'), 'x') - loadedWidth - interfaceWidth :
				settings.get('innerWidth') && setSize(settings.get('innerWidth'), 'x');

		// Sets the minimum dimensions for use in image scaling
		settings.mw = settings.w;
		settings.mh = settings.h;

		// Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
		// If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
		if (settings.get('maxWidth')) {
			settings.mw = setSize(settings.get('maxWidth'), 'x') - loadedWidth - interfaceWidth;
			settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
		}
		if (settings.get('maxHeight')) {
			settings.mh = setSize(settings.get('maxHeight'), 'y') - loadedHeight - interfaceHeight;
			settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
		}

		href = settings.get('href');

		loadingTimer = setTimeout(function () {
			$loadingOverlay.show();
		}, 100);

		if (settings.get('inline')) {
			var $target = $(href).eq(0);
			// Inserts an empty placeholder where inline content is being pulled from.
			// An event is bound to put inline content back when Colorbox closes or loads new content.
			$inline = $('<div>').hide().insertBefore($target);

			$events.one(event_purge, function () {
				$inline.replaceWith($target);
			});

			prep($target);
		} else if (settings.get('iframe')) {
			// IFrame element won't be added to the DOM until it is ready to be displayed,
			// to avoid problems with DOM-ready JS that might be trying to run in that iframe.
			prep(" ");
		} else if (settings.get('html')) {
			prep(settings.get('html'));
		} else if (isImage(settings, href)) {

			href = retinaUrl(settings, href);

			photo = settings.get('createImg');

			$(photo)
			.addClass(prefix + 'Photo')
			.bind('error.'+prefix,function () {
				prep($tag(div, 'Error').html(settings.get('imgError')));
			})
			.one('load', function () {
				if (request !== requests) {
					return;
				}

				// A small pause because some browsers will occasionally report a
				// img.width and img.height of zero immediately after the img.onload fires
				setTimeout(function(){
					var percent;

					if (settings.get('retinaImage') && window.devicePixelRatio > 1) {
						photo.height = photo.height / window.devicePixelRatio;
						photo.width = photo.width / window.devicePixelRatio;
					}

					if (settings.get('scalePhotos')) {
						setResize = function () {
							photo.height -= photo.height * percent;
							photo.width -= photo.width * percent;
						};
						if (settings.mw && photo.width > settings.mw) {
							percent = (photo.width - settings.mw) / photo.width;
							setResize();
						}
						if (settings.mh && photo.height > settings.mh) {
							percent = (photo.height - settings.mh) / photo.height;
							setResize();
						}
					}

					if (settings.h) {
						photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
					}

					if ($related[1] && (settings.get('loop') || $related[index + 1])) {
						photo.style.cursor = 'pointer';

						$(photo).bind('click.'+prefix, function () {
							publicMethod.next();
						});
					}

					photo.style.width = photo.width + 'px';
					photo.style.height = photo.height + 'px';
					prep(photo);
				}, 1);
			});

			photo.src = href;

		} else if (href) {
			$loadingBay.load(href, settings.get('data'), function (data, status) {
				if (request === requests) {
					prep(status === 'error' ? $tag(div, 'Error').html(settings.get('xhrError')) : $(this).contents());
				}
			});
		}
	}

	// Navigates to the next page/image in a set.
	publicMethod.next = function () {
		if (!active && $related[1] && (settings.get('loop') || $related[index + 1])) {
			index = getIndex(1);
			launch($related[index]);
		}
	};

	publicMethod.prev = function () {
		if (!active && $related[1] && (settings.get('loop') || index)) {
			index = getIndex(-1);
			launch($related[index]);
		}
	};

	// Note: to use this within an iframe use the following format: parent.jQuery.colorbox.close();
	publicMethod.close = function () {
		if (open && !closing) {

			closing = true;
			open = false;
			trigger(event_cleanup);
			settings.get('onCleanup');
			$window.unbind('.' + prefix);
			$overlay.fadeTo(settings.get('fadeOut') || 0, 0);

			$box.stop().fadeTo(settings.get('fadeOut') || 0, 0, function () {
				$box.hide();
				$overlay.hide();
				trigger(event_purge);
				$loaded.remove();

				setTimeout(function () {
					closing = false;
					trigger(event_closed);
					settings.get('onClosed');
				}, 1);
			});
		}
	};

	// Removes changes Colorbox made to the document, but does not remove the plugin.
	publicMethod.remove = function () {
		if (!$box) { return; }

		$box.stop();
		$[colorbox].close();
		$box.stop(false, true).remove();
		$overlay.remove();
		closing = false;
		$box = null;
		$('.' + boxElement)
			.removeData(colorbox)
			.removeClass(boxElement);

		$(document).unbind('click.'+prefix).unbind('keydown.'+prefix);
	};

	// A method for fetching the current element Colorbox is referencing.
	// returns a jQuery object.
	publicMethod.element = function () {
		return $(settings.el);
	};

	publicMethod.settings = defaults;

}(jQuery, document, window));


/*! http://keith-wood.name/countdown.html
	Countdown for jQuery v2.1.0.
	Written by Keith Wood (wood.keith{at}optusnet.com.au) January 2008.
	Available under the MIT (http://keith-wood.name/licence.html) license. 
	Please attribute the author if you use it. */

	(function($) { // Hide scope, no $ conflict
		'use strict';
	
		var pluginName = 'countdown';
	
		var Y = 0; // Years
		var O = 1; // Months
		var W = 2; // Weeks
		var D = 3; // Days
		var H = 4; // Hours
		var M = 5; // Minutes
		var S = 6; // Seconds
	
		/** Create the countdown plugin.
			<p>Sets an element to show the time remaining until a given instant.</p>
			<p>Expects HTML like:</p>
			<pre>&lt;div>&lt;/div></pre>
			<p>Provide inline configuration like:</p>
			<pre>&lt;div data-countdown="name: 'value', ...">&lt;/div></pre>
			@module Countdown
			@augments JQPlugin
			@example $(selector).countdown({until: +300}) */
		$.JQPlugin.createPlugin({
		
			/** The name of the plugin.
				@default 'countdown' */
			name: pluginName,
	
			/** Countdown expiry callback.
				Used with the {@linkcode module:Countdown~defaultOptions|onExpiry} option and
				triggered when the countdown expires.
				@global
				@callback CountdownExpiryCallback
				@this <code>Element</code>
				@example onExpiry: function() {
	  alert('Done');
	} */
	
			/** Countdown server synchronisation callback.
				Used with the {@linkcode module:Countdown~defaultOptions|serverSync} option and
				triggered when the countdown is initialised.
				@global
				@callback CountdownServerSyncCallback
				@return {Date} The current date/time on the server as expressed in the local timezone.
				@this <code>$.countdown</code>
				@example serverSync: function() {
	  var time = null;
	  $.ajax({url: 'http://myserver.com/serverTime.php',
		async: false, dataType: 'text',
		success: function(text) {
		  time = new Date(text);
		}, error: function(http, message, exc) {
		  time = new Date();
	  });
	  return time;
	} */
				
			/** Countdown tick callback.
				Used with the {@linkcode module:Countdown~defaultOptions|onTick} option and
				triggered on every {@linkcode module:Countdown~defaultOptions|tickInterval} ticks of the countdown.
				@global
				@callback CountdownTickCallback
				@this <code>Element</code>
				@param {number[]} periods The breakdown by period (years, months, weeks, days,
						hours, minutes, seconds) of the time remaining/passed.
				@example onTick: function(periods) {
	  $('#altTime').text(periods[4] + ':' + twoDigits(periods[5]) +
		':' + twoDigits(periods[6]));
	} */
	
			/** Countdown which labels callback.
				Used with the {@linkcode module:Countdown~regionalOptions|whichLabels} option and
				triggered when the countdown is being display to determine which set of labels
				(<code>labels</code>, <code>labels1</code>, ...) are to be used for the current period value.
				@global
				@callback CountdownWhichLabelsCallback
				@param {number} num The current period value.
				@return {number} The suffix for the label set to use, or zero for the default labels.
				@example whichLabels: function(num) {
	  return (num === 1 ? 1 : (num >= 2 && num <= 4 ? 2 : 0));
	} */
				
			/** Default settings for the plugin.
				@property {Date|number|string} [until] The date/time to count down to, or number of seconds
							offset from now, or string of amounts and units for offset(s) from now:
							'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
							One of <code>until</code> or <code>since</code> must be specified.
							If both are given <code>since</code> takes precedence.
				@example until: new Date(2013, 12-1, 25, 13, 30)
	until: +300
	until: '+1O -2D'
				@property {Date|number|string} [since] The date/time to count up from, or number of seconds
							offset from now, or string of amounts and units for offset(s) from now:
							'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
							One of <code>until</code> or <code>since</code> must be specified.
							If both are given <code>since</code> takes precedence.
				@example since: new Date(2013, 1-1, 1)
	since: -300
	since: '-1O +2D'
				@property {number} [timezone=null] The timezone (hours or minutes from GMT) for the target times,
							or <code>null</code> for client local timezone.
				@example timezone: +10
	timezone: -60
				@property {CountdownServerSyncCallback} [serverSync=null] A function to retrieve the current server time
							for synchronisation.
				@property {string} [format='dHMS'] The format for display - upper case to always show,
							lower case to show only if non-zero,
							'Y' years, 'O' months, 'W' weeks, 'D' days, 'H' hours, 'M' minutes, 'S' seconds.
				@property {string} [layout=''] <p>Build your own layout for the countdown.</p>
							<p>Indicate substitution points with '{desc}' for the description, '{sep}' for the time separator,
							'{pv}' where p is 'y' for years, 'o' for months, 'w' for weeks, 'd' for days,
							'h' for hours, 'm' for minutes, or 's' for seconds and v is 'n' for the period value,
							'nn' for the period value with a minimum of two digits,
							'nnn' for the period value with a minimum of three digits, or
							'l' for the period label (long or short form depending on the compact setting), or
							'{pd}' where p is as above and d is '1' for the units digit, '10' for the tens digit,
							'100' for the hundreds digit, or '1000' for the thousands digit.</p>
							<p>If you need to exclude entire sections when the period value is zero and
							you have specified the period as optional, surround these sections with
							'{p<}' and '{p>}', where p is the same as above.</p>
							<p>Your layout can just be simple text, or can contain HTML markup as well.</p>
				@example layout: '{d<}{dn} {dl}{d>} {hnn}:{mnn}:{snn}'
				@property {boolean} [compact=false] <code>true</code> to display in a compact format,
							<code>false</code> for an expanded one.
				@property {boolean} [padZeroes=false] <code>true</code> to add leading zeroes.
				@property {number} [significant=0] The maximum number of periods with non-zero values to show, zero for all.
				@property {string} [description=''] The description displayed for the countdown.
				@property {string} [expiryUrl=''] A URL to load upon expiry, replacing the current page.
				@property {string} [expiryText=''] Text to display upon expiry, replacing the countdown. This may be HTML.
				@property {boolean} [alwaysExpire=false] <code>true</code> to trigger <code>onExpiry</code>
							even if the target time has passed.
				@property {CountdownExpiryCallback} [onExpiry=null] Callback when the countdown expires -
							receives no parameters and <code>this</code> is the containing element.
				@example onExpiry: function() {
	  ...
	}
				@property {CountdownTickCallback} [onTick=null] Callback when the countdown is updated -
							receives <code>number[7]</code> being the breakdown by period
							(years, months, weeks, days, hours, minutes, seconds - based on
							<code>format</code>) and <code>this</code> is the containing element.
				@example onTick: function(periods) {
	  var secs = $.countdown.periodsToSeconds(periods);
	  if (secs < 300) { // Last five minutes
		...
	  }
	}
				@property {number} [tickInterval=1] The interval (seconds) between <code>onTick</code> callbacks. */
			defaultOptions: {
				until: null,
				since: null,
				timezone: null,
				serverSync: null,
				format: 'dHMS',
				layout: '',
				compact: false,
				padZeroes: false,
				significant: 0,
				description: '',
				expiryUrl: '',
				expiryText: '',
				alwaysExpire: false,
				onExpiry: null,
				onTick: null,
				tickInterval: 1
			},
	
			/** Localisations for the plugin.
				Entries are objects indexed by the language code ('' being the default US/English).
				Each object has the following attributes.
				@property {string[]} [labels=['Years','Months','Weeks','Days','Hours','Minutes','Seconds']]
							The display texts for the counter periods.
				@property {string[]} [labels1=['Year','Month','Week','Day','Hour','Minute','Second']]
							The display texts for the counter periods if they have a value of 1.
							Add other <code>labels<em>n</em></code> attributes as necessary to
							cater for other numeric idiosyncrasies of the localisation.
				@property {string[]}[compactLabels=['y','m','w','d']] The compact texts for the counter periods.
				@property {CountdownWhichLabelsCallback} [whichLabels=null] A function to determine which
							<code>labels<em>n</em></code> to use.
				@example whichLabels: function(num) {
	  return (num > 1 ? 0 : 1);
	}
				@property {string[]} [digits=['0','1',...,'9']] The digits to display (0-9).
				@property {string} [timeSeparator=':'] Separator for time periods in the compact layout.
				@property {boolean} [isRTL=false] <code>true</code> for right-to-left languages,
							<code>false</code> for left-to-right. */
			regionalOptions: { // Available regional settings, indexed by language/country code
				'': { // Default regional settings - English/US
					labels: ['Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'],
					labels1: ['Year', 'Month', 'Week', 'Day', 'Hour', 'Minute', 'Second'],
					compactLabels: ['y', 'm', 'w', 'd'],
					whichLabels: null,
					digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
					timeSeparator: ':',
					isRTL: false
				}
			},
	
			/* Class name for the right-to-left marker. */
			_rtlClass: pluginName + '-rtl',
			/* Class name for the countdown section marker. */
			_sectionClass: pluginName + '-section',
			/* Class name for the period amount marker. */
			_amountClass: pluginName + '-amount',
			/* Class name for the period name marker. */
			_periodClass: pluginName + '-period',
			/* Class name for the countdown row marker. */
			_rowClass: pluginName + '-row',
			/* Class name for the holding countdown marker. */
			_holdingClass: pluginName + '-holding',
			/* Class name for the showing countdown marker. */
			_showClass: pluginName + '-show',
			/* Class name for the description marker. */
			_descrClass: pluginName + '-descr',
	
			/* List of currently active countdown elements. */
			_timerElems: [],
	
			/** Additional setup for the countdown.
				Apply default localisations.
				Create the timer.
				@private */
			_init: function() {
				var self = this;
				this._super();
				this._serverSyncs = [];
				var now = (typeof Date.now === 'function' ? Date.now : function() { return new Date().getTime(); });
				var perfAvail = (window.performance && typeof window.performance.now === 'function');
				// Shared timer for all countdowns
				function timerCallBack(timestamp) {
					var drawStart = (timestamp < 1e12 ? // New HTML5 high resolution timer
						(perfAvail ? (window.performance.now() + window.performance.timing.navigationStart) : now()) :
						// Integer milliseconds since unix epoch
						timestamp || now());
					if (drawStart - animationStartTime >= 1000) {
						self._updateElems();
						animationStartTime = drawStart;
					}
					requestAnimationFrame(timerCallBack);
				}
				var requestAnimationFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame || window.msRequestAnimationFrame || null;
					// This is when we expect a fall-back to setInterval as it's much more fluid
				var animationStartTime = 0;
				if (!requestAnimationFrame || $.noRequestAnimationFrame) {
					$.noRequestAnimationFrame = null;
					// Fall back to good old setInterval
					$.countdown._timer = setInterval(function() { self._updateElems(); }, 1000);
				}
				else {
					animationStartTime = window.animationStartTime ||
						window.webkitAnimationStartTime || window.mozAnimationStartTime ||
						window.oAnimationStartTime || window.msAnimationStartTime || now();
					requestAnimationFrame(timerCallBack);
				}
			},
	
			/** Convert a date/time to UTC.
				@param {number} tz The hour or minute offset from GMT, e.g. +9, -360.
				@param {Date|number} year the date/time in that timezone or the year in that timezone.
				@param {number} [month] The month (0 - 11) (omit if <code>year</code> is a <code>Date</code>).
				@param {number} [day] The day (omit if <code>year</code> is a <code>Date</code>).
				@param {number} [hours] The hour (omit if <code>year</code> is a <code>Date</code>).
				@param {number} [mins] The minute (omit if <code>year</code> is a <code>Date</code>).
				@param {number} [secs] The second (omit if <code>year</code> is a <code>Date</code>).
				@param {number} [ms] The millisecond (omit if <code>year</code> is a <code>Date</code>).
				@return {Date} The equivalent UTC date/time.
				@example $.countdown.UTCDate(+10, 2013, 12-1, 25, 12, 0)
	$.countdown.UTCDate(-7, new Date(2013, 12-1, 25, 12, 0)) */
			UTCDate: function(tz, year, month, day, hours, mins, secs, ms) {
				if (typeof year === 'object' && year instanceof Date) {
					ms = year.getMilliseconds();
					secs = year.getSeconds();
					mins = year.getMinutes();
					hours = year.getHours();
					day = year.getDate();
					month = year.getMonth();
					year = year.getFullYear();
				}
				var d = new Date();
				d.setUTCFullYear(year);
				d.setUTCDate(1);
				d.setUTCMonth(month || 0);
				d.setUTCDate(day || 1);
				d.setUTCHours(hours || 0);
				d.setUTCMinutes((mins || 0) - (Math.abs(tz) < 30 ? tz * 60 : tz));
				d.setUTCSeconds(secs || 0);
				d.setUTCMilliseconds(ms || 0);
				return d;
			},
	
			/** Convert a set of periods into seconds.
				Averaged for months and years.
				@param {number[]} periods The periods per year/month/week/day/hour/minute/second.
				@return {number} The corresponding number of seconds.
				@example var secs = $.countdown.periodsToSeconds(periods) */
			periodsToSeconds: function(periods) {
				return periods[0] * 31557600 + periods[1] * 2629800 + periods[2] * 604800 +
					periods[3] * 86400 + periods[4] * 3600 + periods[5] * 60 + periods[6];
			},
	
			/** Resynchronise the countdowns with the server.
				@example $.countdown.resync() */
			resync: function() {
				var self = this;
				$('.' + this._getMarker()).each(function() { // Each countdown
					var inst = $.data(this, self.name);
					if (inst.options.serverSync) { // If synced
						var serverSync = null;
						for (var i = 0; i < self._serverSyncs.length; i++) {
							if (self._serverSyncs[i][0] === inst.options.serverSync) { // Find sync details
								serverSync = self._serverSyncs[i];
								break;
							}
						}
						if (self._eqNull(serverSync[2])) { // Recalculate if missing
							var serverResult = ($.isFunction(inst.options.serverSync) ?
								inst.options.serverSync.apply(this, []) : null);
							serverSync[2] =
								(serverResult ? new Date().getTime() - serverResult.getTime() : 0) - serverSync[1];
						}
						if (inst._since) { // Apply difference
							inst._since.setMilliseconds(inst._since.getMilliseconds() + serverSync[2]);
						}
						inst._until.setMilliseconds(inst._until.getMilliseconds() + serverSync[2]);
					}
				});
				for (var i = 0; i < self._serverSyncs.length; i++) { // Update sync details
					if (!self._eqNull(self._serverSyncs[i][2])) {
						self._serverSyncs[i][1] += self._serverSyncs[i][2];
						delete self._serverSyncs[i][2];
					}
				}
			},
	
			_instSettings: function(elem, options) { // jshint unused:false
				return {_periods: [0, 0, 0, 0, 0, 0, 0]};
			},
	
			/** Add an element to the list of active ones.
				@private
				@param {Element} elem The countdown element. */
			_addElem: function(elem) {
				if (!this._hasElem(elem)) {
					this._timerElems.push(elem);
				}
			},
	
			/** See if an element is in the list of active ones.
				@private
				@param {Element} elem The countdown element.
				@return {boolean} <code>true</code> if present, <code>false</code> if not. */
			_hasElem: function(elem) {
				return ($.inArray(elem, this._timerElems) > -1);
			},
	
			/** Remove an element from the list of active ones.
				@private
				@param {Element} elem The countdown element. */
			_removeElem: function(elem) {
				this._timerElems = $.map(this._timerElems,
					function(value) { return (value === elem ? null : value); }); // delete entry
			},
	
			/** Update each active timer element.
				@private */
			_updateElems: function() {
				for (var i = this._timerElems.length - 1; i >= 0; i--) {
					this._updateCountdown(this._timerElems[i]);
				}
			},
	
			_optionsChanged: function(elem, inst, options) {
				if (options.layout) {
					options.layout = options.layout.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
				}
				this._resetExtraLabels(inst.options, options);
				var timezoneChanged = (inst.options.timezone !== options.timezone);
				$.extend(inst.options, options);
				this._adjustSettings(elem, inst,
					!this._eqNull(options.until) || !this._eqNull(options.since) || timezoneChanged);
				var now = new Date();
				if ((inst._since && inst._since < now) || (inst._until && inst._until > now)) {
					this._addElem(elem[0]);
				}
				this._updateCountdown(elem, inst);
			},
	
			/** Redisplay the countdown with an updated display.
				@private
				@param {Element|jQuery} elem The containing element.
				@param {object} inst The current settings for this instance. */
			_updateCountdown: function(elem, inst) {
				elem = elem.jquery ? elem : $(elem);
				inst = inst || this._getInst(elem);
				if (!inst) {
					return;
				}
				elem.html(this._generateHTML(inst)).toggleClass(this._rtlClass, inst.options.isRTL);
				if (inst._hold !== 'pause' && $.isFunction(inst.options.onTick)) {
					var periods = inst._hold !== 'lap' ? inst._periods :
						this._calculatePeriods(inst, inst._show, inst.options.significant, new Date());
					if (inst.options.tickInterval === 1 ||
							this.periodsToSeconds(periods) % inst.options.tickInterval === 0) {
						inst.options.onTick.apply(elem[0], [periods]);
					}
				}
				var expired = inst._hold !== 'pause' &&
					(inst._since ? inst._now.getTime() < inst._since.getTime() :
					inst._now.getTime() >= inst._until.getTime());
				if (expired && !inst._expiring) {
					inst._expiring = true;
					if (this._hasElem(elem[0]) || inst.options.alwaysExpire) {
						this._removeElem(elem[0]);
						if ($.isFunction(inst.options.onExpiry)) {
							inst.options.onExpiry.apply(elem[0], []);
						}
						if (inst.options.expiryText) {
							var layout = inst.options.layout;
							inst.options.layout = inst.options.expiryText;
							this._updateCountdown(elem[0], inst);
							inst.options.layout = layout;
						}
						if (inst.options.expiryUrl) {
							window.location = inst.options.expiryUrl;
						}
					}
					inst._expiring = false;
				}
				else if (inst._hold === 'pause') {
					this._removeElem(elem[0]);
				}
			},
	
			/** Reset any extra labelsn and compactLabelsn entries if changing labels.
				@private
				@param {object} base The options to be updated.
				@param {object} options The new option values. */
			_resetExtraLabels: function(base, options) {
				var n = null;
				for (n in options) {
					if (n.match(/[Ll]abels[02-9]|compactLabels1/)) {
						base[n] = options[n];
					}
				}
				for (n in base) { // Remove custom numbered labels
					if (n.match(/[Ll]abels[02-9]|compactLabels1/) && typeof options[n] === 'undefined') {
						base[n] = null;
					}
				}
			},
			
			/** Determine whether or not a value is equivalent to <code>null</code>.
				@private
				@param {object} value The value to test.
				@return {boolean} <code>true</code> if equivalent to <code>null</code>, <code>false</code> if not. */
			_eqNull: function(value) {
				return typeof value === 'undefined' || value === null;
			},
	
	
			/** Calculate internal settings for an instance.
				@private
				@param {jQuery} elem The containing element.
				@param {object} inst The current settings for this instance.
				@param {boolean} recalc <code>true</code> if until or since are set. */
			_adjustSettings: function(elem, inst, recalc) {
				var serverEntry = null;
				for (var i = 0; i < this._serverSyncs.length; i++) {
					if (this._serverSyncs[i][0] === inst.options.serverSync) {
						serverEntry = this._serverSyncs[i][1];
						break;
					}
				}
				var now = null;
				var serverOffset = null;
				if (!this._eqNull(serverEntry)) {
					now = new Date();
					serverOffset = (inst.options.serverSync ? serverEntry : 0);
				}
				else {
					var serverResult = ($.isFunction(inst.options.serverSync) ?
						inst.options.serverSync.apply(elem[0], []) : null);
					now = new Date();
					serverOffset = (serverResult ? now.getTime() - serverResult.getTime() : 0);
					this._serverSyncs.push([inst.options.serverSync, serverOffset]);
				}
				var timezone = inst.options.timezone;
				timezone = (this._eqNull(timezone) ? -now.getTimezoneOffset() : timezone);
				if (recalc || (!recalc && this._eqNull(inst._until) && this._eqNull(inst._since))) {
					inst._since = inst.options.since;
					if (!this._eqNull(inst._since)) {
						inst._since = this.UTCDate(timezone, this._determineTime(inst._since, null));
						if (inst._since && serverOffset) {
							inst._since.setMilliseconds(inst._since.getMilliseconds() + serverOffset);
						}
					}
					inst._until = this.UTCDate(timezone, this._determineTime(inst.options.until, now));
					if (serverOffset) {
						inst._until.setMilliseconds(inst._until.getMilliseconds() + serverOffset);
					}
				}
				inst._show = this._determineShow(inst);
			},
	
			/** Remove the countdown widget from an element.
				@private
				@param {jQuery} elem The containing element.
				@param {object} inst The current instance object. */
			_preDestroy: function(elem, inst) { // jshint unused:false
				this._removeElem(elem[0]);
				elem.empty();
			},
	
			/** Pause a countdown widget at the current time.
				Stop it running but remember and display the current time.
				@param {Element} elem The containing element.
				@example $(selector).countdown('pause') */
			pause: function(elem) {
				this._hold(elem, 'pause');
			},
	
			/** Pause a countdown widget at the current time.
				Stop the display but keep the countdown running.
				@param {Element} elem The containing element.
				@example $(selector).countdown('lap') */
			lap: function(elem) {
				this._hold(elem, 'lap');
			},
	
			/** Resume a paused countdown widget.
				@param {Element} elem The containing element.
				@example $(selector).countdown('resume') */
			resume: function(elem) {
				this._hold(elem, null);
			},
	
			/** Toggle a paused countdown widget.
				@param {Element} elem The containing element.
				@example $(selector).countdown('toggle') */
			toggle: function(elem) {
				var inst = $.data(elem, this.name) || {};
				this[!inst._hold ? 'pause' : 'resume'](elem);
			},
	
			/** Toggle a lapped countdown widget.
				@param {Element} elem The containing element.
				@example $(selector).countdown('toggleLap') */
			toggleLap: function(elem) {
				var inst = $.data(elem, this.name) || {};
				this[!inst._hold ? 'lap' : 'resume'](elem);
			},
	
			/** Pause or resume a countdown widget.
				@private
				@param {Element} elem The containing element.
				@param {string} hold The new hold setting. */
			_hold: function(elem, hold) {
				var inst = $.data(elem, this.name);
				if (inst) {
					if (inst._hold === 'pause' && !hold) {
						inst._periods = inst._savePeriods;
						var sign = (inst._since ? '-' : '+');
						inst[inst._since ? '_since' : '_until'] =
							this._determineTime(sign + inst._periods[0] + 'y' +
								sign + inst._periods[1] + 'o' + sign + inst._periods[2] + 'w' +
								sign + inst._periods[3] + 'd' + sign + inst._periods[4] + 'h' + 
								sign + inst._periods[5] + 'm' + sign + inst._periods[6] + 's');
						this._addElem(elem);
					}
					inst._hold = hold;
					inst._savePeriods = (hold === 'pause' ? inst._periods : null);
					$.data(elem, this.name, inst);
					this._updateCountdown(elem, inst);
				}
			},
	
			/** Return the current time periods, broken down by years, months, weeks, days, hours, minutes, and seconds.
				@param {Element} elem The containing element.
				@return {number[]} The current periods for the countdown.
				@example var periods = $(selector).countdown('getTimes') */
			getTimes: function(elem) {
				var inst = $.data(elem, this.name);
				return (!inst ? null : (inst._hold === 'pause' ? inst._savePeriods : (!inst._hold ? inst._periods :
					this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()))));
			},
	
			/** A time may be specified as an exact value or a relative one.
				@private
				@param {string|number|Date} setting The date/time value as a relative or absolute value.
				@param {Date} defaultTime The date/time to use if no other is supplied.
				@return {Date} The corresponding date/time. */
			_determineTime: function(setting, defaultTime) {
				var self = this;
				var offsetNumeric = function(offset) { // e.g. +300, -2
					var time = new Date();
					time.setTime(time.getTime() + offset * 1000);
					return time;
				};
				var offsetString = function(offset) { // e.g. '+2d', '-4w', '+3h +30m'
					offset = offset.toLowerCase();
					var time = new Date();
					var year = time.getFullYear();
					var month = time.getMonth();
					var day = time.getDate();
					var hour = time.getHours();
					var minute = time.getMinutes();
					var second = time.getSeconds();
					var pattern = /([+-]?[0-9]+)\s*(s|m|h|d|w|o|y)?/g;
					var matches = pattern.exec(offset);
					while (matches) {
						switch (matches[2] || 's') {
							case 's':
								second += parseInt(matches[1], 10);
								break;
							case 'm':
								minute += parseInt(matches[1], 10);
								break;
							case 'h':
								hour += parseInt(matches[1], 10);
								break;
							case 'd':
								day += parseInt(matches[1], 10);
								break;
							case 'w':
								day += parseInt(matches[1], 10) * 7;
								break;
							case 'o':
								month += parseInt(matches[1], 10); 
								day = Math.min(day, self._getDaysInMonth(year, month));
								break;
							case 'y':
								year += parseInt(matches[1], 10);
								day = Math.min(day, self._getDaysInMonth(year, month));
								break;
						}
						matches = pattern.exec(offset);
					}
					return new Date(year, month, day, hour, minute, second, 0);
				};
				var time = (this._eqNull(setting) ? defaultTime :
					(typeof setting === 'string' ? offsetString(setting) :
					(typeof setting === 'number' ? offsetNumeric(setting) : setting)));
				if (time) {
					time.setMilliseconds(0);
				}
				return time;
			},
	
			/** Determine the number of days in a month.
				@private
				@param {number} year The year.
				@param {number} month The month.
				@return {number} The days in that month. */
			_getDaysInMonth: function(year, month) {
				return 32 - new Date(year, month, 32).getDate();
			},
	
			/** Default implementation to determine which set of labels should be used for an amount.
				Use the <code>labels</code> attribute with the same numeric suffix (if it exists).
				@private
				@param {number} num The amount to be displayed.
				@return {number} The set of labels to be used for this amount. */
			_normalLabels: function(num) {
				return num;
			},
	
			/** Generate the HTML to display the countdown widget.
				@private
				@param {object} inst The current settings for this instance.
				@return {string} The new HTML for the countdown display. */
			_generateHTML: function(inst) {
				var self = this;
				// Determine what to show
				inst._periods = (inst._hold ? inst._periods :
					this._calculatePeriods(inst, inst._show, inst.options.significant, new Date()));
				// Show all 'asNeeded' after first non-zero value
				var shownNonZero = false;
				var showCount = 0;
				var sigCount = inst.options.significant;
				var show = $.extend({}, inst._show);
				var period = null;
				for (period = Y; period <= S; period++) {
					shownNonZero = shownNonZero || (inst._show[period] === '?' && inst._periods[period] > 0);
					show[period] = (inst._show[period] === '?' && !shownNonZero ? null : inst._show[period]);
					showCount += (show[period] ? 1 : 0);
					sigCount -= (inst._periods[period] > 0 ? 1 : 0);
				}
				var showSignificant = [false, false, false, false, false, false, false];
				for (period = S; period >= Y; period--) { // Determine significant periods
					if (inst._show[period]) {
						if (inst._periods[period]) {
							showSignificant[period] = true;
						}
						else {
							showSignificant[period] = sigCount > 0;
							sigCount--;
						}
					}
				}
				var labels = (inst.options.compact ? inst.options.compactLabels : inst.options.labels);
				var whichLabels = inst.options.whichLabels || this._normalLabels;
				var showCompact = function(period) {
					var labelsNum = inst.options['compactLabels' + whichLabels(inst._periods[period])];
					return (show[period] ? self._translateDigits(inst, inst._periods[period]) +
						(labelsNum ? labelsNum[period] : labels[period]) + ' ' : '');
				};
				var minDigits = (inst.options.padZeroes ? 2 : 1);
				var showFull = function(period) {
					var labelsNum = inst.options['labels' + whichLabels(inst._periods[period])];
					return ((!inst.options.significant && show[period]) ||
						(inst.options.significant && showSignificant[period]) ?
							'<span class="' + self._sectionClass + '">' +
							'<span class="' + self._amountClass + '">' +
						self._minDigits(inst, inst._periods[period], minDigits) + '</span>' +
						'<span class="' + self._periodClass + '">' +
						(labelsNum ? labelsNum[period] : labels[period]) + '</span></span>' : '');
				};
				return (inst.options.layout ? this._buildLayout(inst, show, inst.options.layout,
					inst.options.compact, inst.options.significant, showSignificant) :
					((inst.options.compact ? // Compact version
					'<span class="' + this._rowClass + ' ' + this._amountClass +
					(inst._hold ? ' ' + this._holdingClass : '') + '">' + 
					showCompact(Y) + showCompact(O) + showCompact(W) + showCompact(D) + 
					(show[H] ? this._minDigits(inst, inst._periods[H], 2) : '') +
					(show[M] ? (show[H] ? inst.options.timeSeparator : '') +
					this._minDigits(inst, inst._periods[M], 2) : '') +
					(show[S] ? (show[H] || show[M] ? inst.options.timeSeparator : '') +
					this._minDigits(inst, inst._periods[S], 2) : '') :
					// Full version
					'<span class="' + this._rowClass + ' ' + this._showClass + (inst.options.significant || showCount) +
					(inst._hold ? ' ' + this._holdingClass : '') + '">' +
					showFull(Y) + showFull(O) + showFull(W) + showFull(D) +
					showFull(H) + showFull(M) + showFull(S)) + '</span>' +
					(inst.options.description ? '<span class="' + this._rowClass + ' ' + this._descrClass + '">' +
					inst.options.description + '</span>' : '')));
			},
	
			/** Construct a custom layout.
				@private
				@param {object} inst The current settings for this instance.
				@param {boolean[]} show Flags indicating which periods are requested.
				@param {string} layout The customised layout.
				@param {boolean} compact <code>true</code> if using compact labels.
				@param {number} significant The number of periods with values to show, zero for all.
				@param {boolean[]} showSignificant Other periods to show for significance.
				@return {string} The custom HTML. */
			_buildLayout: function(inst, show, layout, compact, significant, showSignificant) {
				var labels = inst.options[compact ? 'compactLabels' : 'labels'];
				var whichLabels = inst.options.whichLabels || this._normalLabels;
				var labelFor = function(index) {
					return (inst.options[(compact ? 'compactLabels' : 'labels') +
						whichLabels(inst._periods[index])] || labels)[index];
				};
				var digit = function(value, position) {
					return inst.options.digits[Math.floor(value / position) % 10];
				};
				var subs = {desc: inst.options.description, sep: inst.options.timeSeparator,
					yl: labelFor(Y), yn: this._minDigits(inst, inst._periods[Y], 1),
					ynn: this._minDigits(inst, inst._periods[Y], 2),
					ynnn: this._minDigits(inst, inst._periods[Y], 3), y1: digit(inst._periods[Y], 1),
					y10: digit(inst._periods[Y], 10), y100: digit(inst._periods[Y], 100),
					y1000: digit(inst._periods[Y], 1000),
					ol: labelFor(O), on: this._minDigits(inst, inst._periods[O], 1),
					onn: this._minDigits(inst, inst._periods[O], 2),
					onnn: this._minDigits(inst, inst._periods[O], 3), o1: digit(inst._periods[O], 1),
					o10: digit(inst._periods[O], 10), o100: digit(inst._periods[O], 100),
					o1000: digit(inst._periods[O], 1000),
					wl: labelFor(W), wn: this._minDigits(inst, inst._periods[W], 1),
					wnn: this._minDigits(inst, inst._periods[W], 2),
					wnnn: this._minDigits(inst, inst._periods[W], 3), w1: digit(inst._periods[W], 1),
					w10: digit(inst._periods[W], 10), w100: digit(inst._periods[W], 100),
					w1000: digit(inst._periods[W], 1000),
					dl: labelFor(D), dn: this._minDigits(inst, inst._periods[D], 1),
					dnn: this._minDigits(inst, inst._periods[D], 2),
					dnnn: this._minDigits(inst, inst._periods[D], 3), d1: digit(inst._periods[D], 1),
					d10: digit(inst._periods[D], 10), d100: digit(inst._periods[D], 100),
					d1000: digit(inst._periods[D], 1000),
					hl: labelFor(H), hn: this._minDigits(inst, inst._periods[H], 1),
					hnn: this._minDigits(inst, inst._periods[H], 2),
					hnnn: this._minDigits(inst, inst._periods[H], 3), h1: digit(inst._periods[H], 1),
					h10: digit(inst._periods[H], 10), h100: digit(inst._periods[H], 100),
					h1000: digit(inst._periods[H], 1000),
					ml: labelFor(M), mn: this._minDigits(inst, inst._periods[M], 1),
					mnn: this._minDigits(inst, inst._periods[M], 2),
					mnnn: this._minDigits(inst, inst._periods[M], 3), m1: digit(inst._periods[M], 1),
					m10: digit(inst._periods[M], 10), m100: digit(inst._periods[M], 100),
					m1000: digit(inst._periods[M], 1000),
					sl: labelFor(S), sn: this._minDigits(inst, inst._periods[S], 1),
					snn: this._minDigits(inst, inst._periods[S], 2),
					snnn: this._minDigits(inst, inst._periods[S], 3), s1: digit(inst._periods[S], 1),
					s10: digit(inst._periods[S], 10), s100: digit(inst._periods[S], 100),
					s1000: digit(inst._periods[S], 1000)};
				var html = layout;
				// Replace period containers: {p<}...{p>}
				for (var i = Y; i <= S; i++) {
					var period = 'yowdhms'.charAt(i);
					var re = new RegExp('\\{' + period + '<\\}([\\s\\S]*)\\{' + period + '>\\}', 'g');
					html = html.replace(re, ((!significant && show[i]) ||
						(significant && showSignificant[i]) ? '$1' : ''));
				}
				// Replace period values: {pn}
				$.each(subs, function(n, v) {
					var re = new RegExp('\\{' + n + '\\}', 'g');
					html = html.replace(re, v);
				});
				return html;
			},
	
			/** Ensure a numeric value has at least n digits for display.
				@private
				@param {object} inst The current settings for this instance.
				@param {number} value The value to display.
				@param {number} len The minimum length.
				@return {string} The display text. */
			_minDigits: function(inst, value, len) {
				value = '' + value;
				if (value.length >= len) {
					return this._translateDigits(inst, value);
				}
				value = '0000000000' + value;
				return this._translateDigits(inst, value.substr(value.length - len));
			},
	
			/** Translate digits into other representations.
				@private
				@param {object} inst The current settings for this instance.
				@param {string} value The text to translate.
				@return {string} The translated text. */
			_translateDigits: function(inst, value) {
				return ('' + value).replace(/[0-9]/g, function(digit) {
						return inst.options.digits[digit];
					});
			},
	
			/** Translate the format into flags for each period.
				@private
				@param {object} inst The current settings for this instance.
				@return {string[]} Flags indicating which periods are requested (?) or
						required (!) by year, month, week, day, hour, minute, second. */
			_determineShow: function(inst) {
				var format = inst.options.format;
				var show = [];
				show[Y] = (format.match('y') ? '?' : (format.match('Y') ? '!' : null));
				show[O] = (format.match('o') ? '?' : (format.match('O') ? '!' : null));
				show[W] = (format.match('w') ? '?' : (format.match('W') ? '!' : null));
				show[D] = (format.match('d') ? '?' : (format.match('D') ? '!' : null));
				show[H] = (format.match('h') ? '?' : (format.match('H') ? '!' : null));
				show[M] = (format.match('m') ? '?' : (format.match('M') ? '!' : null));
				show[S] = (format.match('s') ? '?' : (format.match('S') ? '!' : null));
				return show;
			},
	
			/** Calculate the requested periods between now and the target time.
				@private
				@param {object} inst The current settings for this instance.
				@param {string[]} show Flags indicating which periods are requested/required.
				@param {number} significant The number of periods with values to show, zero for all.
				@param {Date} now The current date and time.
				@return {number[]} The current time periods (always positive)
						by year, month, week, day, hour, minute, second. */
			_calculatePeriods: function(inst, show, significant, now) {
				// Find endpoints
				inst._now = now;
				inst._now.setMilliseconds(0);
				var until = new Date(inst._now.getTime());
				if (inst._since) {
					if (now.getTime() < inst._since.getTime()) {
						inst._now = now = until;
					}
					else {
						now = inst._since;
					}
				}
				else {
					until.setTime(inst._until.getTime());
					if (now.getTime() > inst._until.getTime()) {
						inst._now = now = until;
					}
				}
				// Calculate differences by period
				var periods = [0, 0, 0, 0, 0, 0, 0];
				if (show[Y] || show[O]) {
					// Treat end of months as the same
					var lastNow = this._getDaysInMonth(now.getFullYear(), now.getMonth());
					var lastUntil = this._getDaysInMonth(until.getFullYear(), until.getMonth());
					var sameDay = (until.getDate() === now.getDate() ||
						(until.getDate() >= Math.min(lastNow, lastUntil) &&
						now.getDate() >= Math.min(lastNow, lastUntil)));
					var getSecs = function(date) {
						return (date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds();
					};
					var months = Math.max(0,
						(until.getFullYear() - now.getFullYear()) * 12 + until.getMonth() - now.getMonth() +
						((until.getDate() < now.getDate() && !sameDay) ||
						(sameDay && getSecs(until) < getSecs(now)) ? -1 : 0));
					periods[Y] = (show[Y] ? Math.floor(months / 12) : 0);
					periods[O] = (show[O] ? months - periods[Y] * 12 : 0);
					// Adjust for months difference and end of month if necessary
					now = new Date(now.getTime());
					var wasLastDay = (now.getDate() === lastNow);
					var lastDay = this._getDaysInMonth(now.getFullYear() + periods[Y],
						now.getMonth() + periods[O]);
					if (now.getDate() > lastDay) {
						now.setDate(lastDay);
					}
					now.setFullYear(now.getFullYear() + periods[Y]);
					now.setMonth(now.getMonth() + periods[O]);
					if (wasLastDay) {
						now.setDate(lastDay);
					}
				}
				var diff = Math.floor((until.getTime() - now.getTime()) / 1000);
				var period = null;
				var extractPeriod = function(period, numSecs) {
					periods[period] = (show[period] ? Math.floor(diff / numSecs) : 0);
					diff -= periods[period] * numSecs;
				};
				extractPeriod(W, 604800);
				extractPeriod(D, 86400);
				extractPeriod(H, 3600);
				extractPeriod(M, 60);
				extractPeriod(S, 1);
				if (diff > 0 && !inst._since) { // Round up if left overs
					var multiplier = [1, 12, 4.3482, 7, 24, 60, 60];
					var lastShown = S;
					var max = 1;
					for (period = S; period >= Y; period--) {
						if (show[period]) {
							if (periods[lastShown] >= max) {
								periods[lastShown] = 0;
								diff = 1;
							}
							if (diff > 0) {
								periods[period]++;
								diff = 0;
								lastShown = period;
								max = 1;
							}
						}
						max *= multiplier[period];
					}
				}
				if (significant) { // Zero out insignificant periods
					for (period = Y; period <= S; period++) {
						if (significant && periods[period]) {
							significant--;
						}
						else if (!significant) {
							periods[period] = 0;
						}
					}
				}
				return periods;
			}
		});
	
	})(jQuery);


/*! Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
!function(){"use strict";var a=!1;window.JQClass=function(){},JQClass.classes={},JQClass.extend=function b(c){function d(){!a&&this._init&&this._init.apply(this,arguments)}var e=this.prototype;a=!0;var f=new this;a=!1;for(var g in c)if("function"==typeof c[g]&&"function"==typeof e[g])f[g]=function(a,b){return function(){var c=this._super;this._super=function(b){return e[a].apply(this,b||[])};var d=b.apply(this,arguments);return this._super=c,d}}(g,c[g]);else if("object"==typeof c[g]&&"object"==typeof e[g]&&"defaultOptions"===g){var h,i=e[g],j=c[g],k={};for(h in i)k[h]=i[h];for(h in j)k[h]=j[h];f[g]=k}else f[g]=c[g];return d.prototype=f,d.prototype.constructor=d,d.extend=b,d}}(),/*! Abstract base class for collection plugins v1.0.2.
	Written by Keith Wood (wood.keith{at}optusnet.com.au) December 2013.
	Licensed under the MIT license (http://keith-wood.name/licence.html). */
function($){"use strict";function camelCase(a){return a.replace(/-([a-z])/g,function(a,b){return b.toUpperCase()})}JQClass.classes.JQPlugin=JQClass.extend({name:"plugin",defaultOptions:{},regionalOptions:{},deepMerge:!0,_getMarker:function(){return"is-"+this.name},_init:function(){$.extend(this.defaultOptions,this.regionalOptions&&this.regionalOptions[""]||{});var a=camelCase(this.name);$[a]=this,$.fn[a]=function(b){var c=Array.prototype.slice.call(arguments,1),d=this,e=this;return this.each(function(){if("string"==typeof b){if("_"===b[0]||!$[a][b])throw"Unknown method: "+b;var f=$[a][b].apply($[a],[this].concat(c));if(f!==d&&void 0!==f)return e=f,!1}else $[a]._attach(this,b)}),e}},setDefaults:function(a){$.extend(this.defaultOptions,a||{})},_attach:function(a,b){if(a=$(a),!a.hasClass(this._getMarker())){a.addClass(this._getMarker()),b=$.extend(this.deepMerge,{},this.defaultOptions,this._getMetadata(a),b||{});var c=$.extend({name:this.name,elem:a,options:b},this._instSettings(a,b));a.data(this.name,c),this._postAttach(a,c),this.option(a,b)}},_instSettings:function(a,b){return{}},_postAttach:function(a,b){},_getMetadata:function(elem){try{var data=elem.data(this.name.toLowerCase())||"";data=data.replace(/(\\?)'/g,function(a,b){return b?"'":'"'}).replace(/([a-zA-Z0-9]+):/g,function(a,b,c){var d=data.substring(0,c).match(/"/g);return d&&d.length%2!==0?b+":":'"'+b+'":'}).replace(/\\:/g,":"),data=$.parseJSON("{"+data+"}");for(var key in data)if(data.hasOwnProperty(key)){var value=data[key];"string"==typeof value&&value.match(/^new Date\(([-0-9,\s]*)\)$/)&&(data[key]=eval(value))}return data}catch(a){return{}}},_getInst:function(a){return $(a).data(this.name)||{}},option:function(a,b,c){a=$(a);var d=a.data(this.name),e=b||{};return!b||"string"==typeof b&&"undefined"==typeof c?(e=(d||{}).options,e&&b?e[b]:e):void(a.hasClass(this._getMarker())&&("string"==typeof b&&(e={},e[b]=c),this._optionsChanged(a,d,e),$.extend(d.options,e)))},_optionsChanged:function(a,b,c){},destroy:function(a){a=$(a),a.hasClass(this._getMarker())&&(this._preDestroy(a,this._getInst(a)),a.removeData(this.name).removeClass(this._getMarker()))},_preDestroy:function(a,b){}}),$.JQPlugin={createPlugin:function(a,b){"object"==typeof a&&(b=a,a="JQPlugin"),a=camelCase(a);var c=camelCase(b.name);JQClass.classes[c]=JQClass.classes[a].extend(b),new JQClass.classes[c]}}}(jQuery);
//# sourceMappingURL=jquery.plugin.min.map