/* js-suite.min.js packages the following for download efficiency and load order:
hoverIntent 1.8.1 -  by Brian Cherne
superfish-1.7.9 - by Joel Birch
superFishAria-0.2 - by Jared Noble - optional ARIA enhancer for Superfish menu
sideMenuAria-0.2 - by Jared Noble - basic ARIA for the Alaska USA mobile flyin menu
leanModal-AKUSA v2.0 - based on leanModalv1.1 - by Ray Stone
jquery-tabSet v1.5.0 - by Jared Noble, based on jquery-tabs by Sam Croft
angelfish.js code - by ActualMetrics
:focusable jquery selector

changes for v1.9.6
Update for compatibility with jQuery 3.x
*/

/*!
 * hoverIntent v1.8.1 // 2014.08.11 // jQuery v1.9.1+
 * http://cherne.net/brian/resources/jquery.hoverIntent.html
 *
 * You may use hoverIntent under the terms of the MIT license. Basically that
 * means you are free to use hoverIntent as long as this header is left intact.
 * Copyright 2007, 2014 Brian Cherne
 */

/* hoverIntent is similar to jQuery's built-in "hover" method except that
 * instead of firing the handlerIn function immediately, hoverIntent checks
 * to see if the user's mouse has slowed down (beneath the sensitivity
 * threshold) before firing the event. The handlerOut function is only
 * called after a matching handlerIn.
 *
 * // basic usage ... just like .hover()
 * .hoverIntent( handlerIn, handlerOut )
 * .hoverIntent( handlerInOut )
 *
 * // basic usage ... with event delegation!
 * .hoverIntent( handlerIn, handlerOut, selector )
 * .hoverIntent( handlerInOut, selector )
 *
 * // using a basic configuration object
 * .hoverIntent( config )
 *
 * @param  handlerIn   function OR configuration object
 * @param  handlerOut  function OR selector for delegation OR undefined
 * @param  selector    selector OR undefined
 * @author Brian Cherne <brian(at)cherne(dot)net>
 */

(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (jQuery && !jQuery.fn.hoverIntent) {
        factory(jQuery);
    }
})(function($) {
    'use strict';

    // default configuration values
    var _cfg = {
        interval: 100,
        sensitivity: 6,
        timeout: 300
    };

    // counter used to generate an ID for each instance
    var INSTANCE_COUNT = 0;

    // current X and Y position of mouse, updated during mousemove tracking (shared across instances)
    var cX, cY;

    // saves the current pointer position coordinated based on the given mouse event
    var track = function(ev) {
        cX = ev.pageX;
        cY = ev.pageY;
    };

    // compares current and previous mouse positions
    var compare = function(ev,$el,s,cfg) {
        // compare mouse positions to see if pointer has slowed enough to trigger `over` function
        if ( Math.sqrt( (s.pX-cX)*(s.pX-cX) + (s.pY-cY)*(s.pY-cY) ) < cfg.sensitivity ) {
            $el.off('mousemove.hoverIntent'+s.namespace,track);
            delete s.timeoutId;
            // set hoverIntent state as active for this element (so `out` handler can eventually be called)
            s.isActive = true;
            // clear coordinate data
            delete s.pX; delete s.pY;
            return cfg.over.apply($el[0],[ev]);
        } else {
            // set previous coordinates for next comparison
            s.pX = cX; s.pY = cY;
            // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
            s.timeoutId = setTimeout( function(){compare(ev, $el, s, cfg);} , cfg.interval );
        }
    };

    // triggers given `out` function at configured `timeout` after a mouseleave and clears state
    var delay = function(ev,$el,s,out) {
        delete $el.data('hoverIntent')[s.id];
        return out.apply($el[0],[ev]);
    };

    $.fn.hoverIntent = function(handlerIn,handlerOut,selector) {
        // instance ID, used as a key to store and retrieve state information on an element
        var instanceId = INSTANCE_COUNT++;

        // extend the default configuration and parse parameters
        var cfg = $.extend({}, _cfg);
        if ( $.isPlainObject(handlerIn) ) {
            cfg = $.extend(cfg, handlerIn );
//        } else if ($.isFunction(handlerOut)) { - jq3.x update
        } else if (typeof(handlerOut) === "function") {

            cfg = $.extend(cfg, { over: handlerIn, out: handlerOut, selector: selector } );
        } else {
            cfg = $.extend(cfg, { over: handlerIn, out: handlerIn, selector: handlerOut } );
        }

        // A private function for handling mouse 'hovering'
        var handleHover = function(e) {
            // cloned event to pass to handlers (copy required for event object to be passed in IE)
            var ev = $.extend({},e);

            // the current target of the mouse event, wrapped in a jQuery object
            var $el = $(this);

            // read hoverIntent data from element (or initialize if not present)
            var hoverIntentData = $el.data('hoverIntent');
            if (!hoverIntentData) { $el.data('hoverIntent', (hoverIntentData = {})); }

            // read per-instance state from element (or initialize if not present)
            var state = hoverIntentData[instanceId];
            if (!state) { hoverIntentData[instanceId] = state = { id: instanceId }; }

            // state properties:
            // id = instance ID, used to clean up data
            // timeoutId = timeout ID, reused for tracking mouse position and delaying "out" handler
            // isActive = plugin state, true after `over` is called just until `out` is called
            // pX, pY = previously-measured pointer coordinates, updated at each polling interval
            // namespace = string used as namespace for per-instance event management

            // clear any existing timeout
            if (state.timeoutId) { state.timeoutId = clearTimeout(state.timeoutId); }

            // event namespace, used to register and unregister mousemove tracking
            var namespace = state.namespace = '.hoverIntent'+instanceId;

            // handle the event, based on its type
            if (e.type === 'mouseenter') {
                // do nothing if already active
                if (state.isActive) { return; }
                // set "previous" X and Y position based on initial entry point
                state.pX = ev.pageX; state.pY = ev.pageY;
                // update "current" X and Y position based on mousemove
                $el.on('mousemove.hoverIntent'+namespace,track);
                // start polling interval (self-calling timeout) to compare mouse coordinates over time
                state.timeoutId = setTimeout( function(){compare(ev,$el,state,cfg);} , cfg.interval );
            } else { // "mouseleave"
                // do nothing if not already active
                if (!state.isActive) { return; }
                // unbind expensive mousemove event
                $el.off('mousemove.hoverIntent'+namespace,track);
                // if hoverIntent state is true, then call the mouseOut function after the specified delay
                state.timeoutId = setTimeout( function(){delay(ev,$el,state,cfg.out);} , cfg.timeout );
            }
        };

        // listen for mouseenter and mouseleave
        return this.on({'mouseenter.hoverIntent':handleHover,'mouseleave.hoverIntent':handleHover}, cfg.selector);
    };
});



/*
 * jQuery Superfish Menu Plugin - v1.7.9
 * Copyright (c) 2016 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */

;(function ($, w) {
	"use strict";

	var methods = (function () {
		// private properties and methods go here
		var c = {
				bcClass: 'sf-breadcrumb',
				menuClass: 'sf-js-enabled',
				anchorClass: 'sf-with-ul',
				menuArrowClass: 'sf-arrows'
			},
			ios = (function () {
				var ios = /^(?![\w\W]*Windows Phone)[\w\W]*(iPhone|iPad|iPod)/i.test(navigator.userAgent);
				if (ios) {
					// tap anywhere on iOS to unfocus a submenu
					$('html').css('cursor', 'pointer').on('click', $.noop);
				}
				return ios;
			})(),
			wp7 = (function () {
				var style = document.documentElement.style;
				return ('behavior' in style && 'fill' in style && /iemobile/i.test(navigator.userAgent));
			})(),
			unprefixedPointerEvents = (function () {
				return (!!w.PointerEvent);
			})(),
			toggleMenuClasses = function ($menu, o, add) {
				var classes = c.menuClass,
					method;
				if (o.cssArrows) {
					classes += ' ' + c.menuArrowClass;
				}
				method = (add) ? 'addClass' : 'removeClass';
				$menu[method](classes);
			},
			setPathToCurrent = function ($menu, o) {
				return $menu.find('li.' + o.pathClass).slice(0, o.pathLevels)
					.addClass(o.hoverClass + ' ' + c.bcClass)
						.filter(function () {
							return ($(this).children(o.popUpSelector).hide().show().length);
						}).removeClass(o.pathClass);
			},
			toggleAnchorClass = function ($li, add) {
				var method = (add) ? 'addClass' : 'removeClass';
				$li.children('a')[method](c.anchorClass);
			},
			toggleTouchAction = function ($menu) {
				var msTouchAction = $menu.css('ms-touch-action');
				var touchAction = $menu.css('touch-action');
				touchAction = touchAction || msTouchAction;
				touchAction = (touchAction === 'pan-y') ? 'auto' : 'pan-y';
				$menu.css({
					'ms-touch-action': touchAction,
					'touch-action': touchAction
				});
			},
			getMenu = function ($el) {
				return $el.closest('.' + c.menuClass);
			},
			getOptions = function ($el) {
				return getMenu($el).data('sfOptions');
			},
			over = function () {
				var $this = $(this),
					o = getOptions($this);
				clearTimeout(o.sfTimer);
				$this.siblings().superfish('hide').end().superfish('show');
			},
			close = function (o) {
				o.retainPath = ($.inArray(this[0], o.$path) > -1);
				this.superfish('hide');

				if (!this.parents('.' + o.hoverClass).length) {
					o.onIdle.call(getMenu(this));
					if (o.$path.length) {
						$.proxy(over, o.$path)();
					}
				}
			},
			out = function () {
				var $this = $(this),
					o = getOptions($this);
				if (ios) {
					$.proxy(close, $this, o)();
				}
				else {
					clearTimeout(o.sfTimer);
					o.sfTimer = setTimeout($.proxy(close, $this, o), o.delay);
				}
			},
			touchHandler = function (e) {
				var $this = $(this),
					o = getOptions($this),
					$ul = $this.siblings(e.data.popUpSelector);

				if (o.onHandleTouch.call($ul) === false) {
					return this;
				}

				if ($ul.length > 0 && $ul.is(':hidden')) {
					$this.one('click.superfish', false);
					if (e.type === 'MSPointerDown' || e.type === 'pointerdown') {
						$this.trigger('focus');
					} else {
						$.proxy(over, $this.parent('li'))();
					}
				}
			},
			applyHandlers = function ($menu, o) {
				var targets = 'li:has(' + o.popUpSelector + ')';
				if ($.fn.hoverIntent && !o.disableHI) {
					$menu.hoverIntent(over, out, targets);
				}
				else {
					$menu
						.on('mouseenter.superfish', targets, over)
						.on('mouseleave.superfish', targets, out);
				}
				var touchevent = 'MSPointerDown.superfish';
				if (unprefixedPointerEvents) {
					touchevent = 'pointerdown.superfish';
				}
				if (!ios) {
					touchevent += ' touchend.superfish';
				}
				if (wp7) {
					touchevent += ' mousedown.superfish';
				}
				$menu
					.on('focusin.superfish', 'li', over)
					.on('focusout.superfish', 'li', out)
					.on(touchevent, 'a', o, touchHandler);
			};

		return {
			// public methods
			hide: function (instant) {
				if (this.length) {
					var $this = this,
						o = getOptions($this);
					if (!o) {
						return this;
					}
					var not = (o.retainPath === true) ? o.$path : '',
						$ul = $this.find('li.' + o.hoverClass).add(this).not(not).removeClass(o.hoverClass).children(o.popUpSelector),
						speed = o.speedOut;

					if (instant) {
						$ul.show();
						speed = 0;
					}
					o.retainPath = false;

					if (o.onBeforeHide.call($ul) === false) {
						return this;
					}

					$ul.stop(true, true).animate(o.animationOut, speed, function () {
						var $this = $(this);
						o.onHide.call($this);
					});
				}
				return this;
			},
			show: function () {
				var o = getOptions(this);
				if (!o) {
					return this;
				}
				var $this = this.addClass(o.hoverClass),
					$ul = $this.children(o.popUpSelector);

				if (o.onBeforeShow.call($ul) === false) {
					return this;
				}

				$ul.stop(true, true).animate(o.animation, o.speed, function () {
					o.onShow.call($ul);
				});
				return this;
			},
			destroy: function () {
				return this.each(function () {
					var $this = $(this),
						o = $this.data('sfOptions'),
						$hasPopUp;
					if (!o) {
						return false;
					}
					$hasPopUp = $this.find(o.popUpSelector).parent('li');
					clearTimeout(o.sfTimer);
					toggleMenuClasses($this, o);
					toggleAnchorClass($hasPopUp);
					toggleTouchAction($this);
					// remove event handlers
					$this.off('.superfish').off('.hoverIntent');
					// clear animation's inline display style
					$hasPopUp.children(o.popUpSelector).attr('style', function (i, style) {
						return style.replace(/display[^;]+;?/g, '');
					});
					// reset 'current' path classes
					o.$path.removeClass(o.hoverClass + ' ' + c.bcClass).addClass(o.pathClass);
					$this.find('.' + o.hoverClass).removeClass(o.hoverClass);
					o.onDestroy.call($this);
					$this.removeData('sfOptions');
				});
			},
			init: function (op) {
				return this.each(function () {
					var $this = $(this);
					if ($this.data('sfOptions')) {
						return false;
					}
					var o = $.extend({}, $.fn.superfish.defaults, op),
						$hasPopUp = $this.find(o.popUpSelector).parent('li');
//						console.log($hasPopUp[0]);
					o.$path = setPathToCurrent($this, o);

					$this.data('sfOptions', o);

					toggleMenuClasses($this, o, true);
					toggleAnchorClass($hasPopUp, true);
					toggleTouchAction($this);
					applyHandlers($this, o);

					$hasPopUp.not('.' + c.bcClass).superfish('hide', true);

					o.onInit.call(this);
				});
			}
		};
	})();

	$.fn.superfish = function (method, args) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
		}
		else {
			return $.error('Method ' +  method + ' does not exist on jQuery.fn.superfish');
		}
	};

	$.fn.superfish.defaults = {
		popUpSelector: 'ul,div,.menu,.sf-mega', // within menu context
		hoverClass: 'sfHover',
		pathClass: 'overrideThisToUse',
		pathLevels: 1,
		delay: 0,
		animation: {opacity: 'show'},
		animationOut: {opacity: 'hide'},
		speed: 'normal',
		speedOut: 'fast',
		cssArrows: true,
		disableHI: false,
		onInit: $.noop,
		onBeforeShow: $.noop,
		onShow: $.noop,
		onBeforeHide: $.noop,
		onHide: $.noop,
		onIdle: $.noop,
		onDestroy: $.noop,
		onHandleTouch: $.noop
	};
})(jQuery, window);

/*
 * superFishAria v0.2 - optional ARIA enhancer for Superfish menu.
 * usage: $(ul).superfish().sfAria() first converts ul to a superfish menu, then applies this Aria support
 *
 * Adds roles and aria attribues to menu elements.
 * Auto-assigns ids as necessary to support aria-controls and aria-labelled by attributes.
 * Menu openers are assumed to be a elements in top-level li of the superfish menu -get role=button
 *  the ul children of the same li is designated a pop-up, while descendent "a" elements have role=menuitem
 * Keyboard control added to the menu buttons and pop-up menus themselves.
 *
 * Inspired by https://www.drupal.org/node/2674280 / https://www.drupal.org/files/issues/aria.js_.txt
 *
 * Updates
 * 11-24-20 - hidden elements must not contain focusable elements (inputs can be disabled)

 */

(function($) {
	$.fn.sfAria = function(sfIndex) {
		if(this.id == "") this.id="sfAriaMenu_" + sfIndex; // Auto assign id to superfish if one does not exist
		var $sf = $(this),
		keys = { tab:9, enter:13, esc:27, space:32, pageup:33, pagedown:34,
			end:35, home:36, left:37, up:38, right:39, down:40 };
		$sf.children("li").each(function(index){
			if(this.id == "") this.id=$sf.attr("id") + "_" + index; // Auto assign id to submenu if one does not exist
			var $li=$(this);
			$li.attr('sfa-menuParent',true);
			$li.children('a')
				.addClass('sfa-btn').attr('id','sfa-btn_'+$li.attr('id')).attr('role','button')
				.attr('aria-hasPopup',true).attr('aria-expanded',false).attr('aria-owns','sfa-menu_'+$li.attr('id'))
				.attr('aria-controls','sfa-menu_'+$li.attr('id'));
			$li.children('.menu')
				.attr('id','sfa-menu_'+$li.attr('id')).addClass('sfa-menu').attr('role','group')
                .attr('aria-hidden',true).attr('aria-labelledby','sfa-btn_'+$li.attr('id'));
            // 11-24-20 - inputs that are inside of hidden elements must not be focusable
            $li.children('.menu').find('input').prop('disabled',true);
			$(".menu li",$sf).attr('role','none');
			$(".menu a",$sf).attr('role','menuitem').attr('tabindex',"-1");
		});
		onHide = function() {
			var $li = this.closest('li[sfa-menuParent]');
			$($li.children('a').attr('aria-controls')).attr('aria-hidden', true);
            // 11-24-20 - inputs that are children of hidden element should be disabled when the element is hidden element
			$("#" + $li.children('a').attr('aria-controls')).find('input').prop('disabled', true);
			$li.children('a').attr('aria-expanded', false);
		},
		onBeforeShow = function() {
			var $li = this.closest('li[sfa-menuParent]');
            $li.children('a').attr('aria-expanded', true)
			$($li.children('a').attr('aria-controls')).attr('aria-hidden', false);
            // 11-24-20 - inputs that are children of hidden element should be enabled when hidden element is shown
			$("#" + $li.children('a').attr('aria-controls')).find('input').prop('disabled',false);
		},
		applyHandlers = function ($menu) {
			$menu.on('keydown','.sfa-btn', onButtonKeydown);
			$menu.on('keydown','.sfa-menu', onMenuKeydown);
		},
		onButtonKeydown = function(ev) {
			var flag=false,
				$target=$(ev.target),
				$menu = $target.closest("ul.sf-js-enabled"),
				$submenu=$("#" + $target.attr("aria-controls")),
				$items=$(".sfa-btn",$menu),
				k,item=-1;
			for (k=0 ; k < $items.length ; k++ ) {
				if($target.is($items[k])) { item = k ; break; }
			}
			if(item < 0) return false;
			// on space or down, open menu (if not open) and focus on first link
			if (ev.which == keys.space || ev.which == keys.down) {
				$("a, input[type='text']",$submenu).first().trigger("focus");
				flag=true;
			}
			// on esc or up close menu if it is open
			if (ev.which == keys.esc || ev.which == keys.up) {
				console.log("buttonKeydown:esc or up");
				$menu.superfish.close();
				flag=true;
			}
			// move to the previous tab
			if (ev.which == keys.left){
				if(item > 0){
					$items[item-1].trigger("focus");
				} else {
					$items.last().trigger("focus");
			}
				flag=true;
			}
			// move to next tab
			if (ev.which == keys.right){
				if(item+1 < $items.length){
					$items[item+1].trigger("focus");
				} else {
					$items[0].trigger("focus");
				}
				flag=true;
			}
			if (flag) {
				ev.stopPropagation();
				ev.preventDefault();
			} else {
				//console.log("key:"+ev.which);
			}

		},
		onMenuKeydown = function(ev) {
			var flag=false;
			//console.log("sfa-MenuKeydown:" + ev.which);
			var $target=$(ev.target);
			var $submenu=$target.closest(".menu");
			var $btn=$("#" + $submenu.attr("aria-labelledby"));
			var $items=$("a, input",$submenu);
			var k,item=-1;
			for (k=0 ; k < $items.length ; k++ ) {
				if($target.is($items[k])) { item = k ; break; }
			}
			if(item < 0) return false;
			// move to previous link
			if ((ev.which == keys.up)||(ev.which == keys.left)){
				if(item > 0){
					$items[item-1].trigger("focus");
				} else {
					$items.last().trigger("focus");
				}
				flag=true;
			}
			// move to next link
			if ((ev.which == keys.right)||(ev.which == keys.down)){
				if(item+1 < $items.length){
					$items[item+1].trigger("focus");
				} else {
					$items[0].trigger("focus");
				}
				flag=true;
			}
			// move to first / last links in menu
			if (ev.which == keys.home) {
				$items.first().trigger("focus");
				flag=true;
			}
			if (ev.which == keys.end) {
				$items.last().trigger("focus");
				flag=true;
			}
			// close menu and focus on menuBtn
			if (ev.which == keys.esc) {
				$btn.trigger("focus");
				flag=true;
			}
			if (flag) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		};
		applyHandlers($sf);

		return $(this).each(function() {
			var o = $(this).data('sf-options')// Get this menu's options & store existing callbacks
			var _onBeforeShow = o.onBeforeShow,
				_onHide = o.onHide;
			$.extend(o,{
				// overwrite existing callbacks to call sfAria callbacks, followed by the stored callbacks
				onBeforeShow: function() {
					onBeforeShow.call(this);
					_onBeforeShow.call(this);
				},
				onHide: function() {
					onHide.call(this);
					_onHide.call(this);
				}
			});
		});
	};
})(jQuery);


/* sideMenuAria 0.2 (sma)
 - fork of sfAria, adding basic accessibility to the flyin menu in mobile/small screen mode.
 - Alaska USA specific
*/

(function($) {
  $.fn.sideMenuAria = function(opt) {
		var keys = { tab:9, enter:13, esc:27, space:32, pageup:33, pagedown:34,
				end:35, home:36, left:37, up:38, right:39, down:40 };
		var defaults = {
			btnContainer: 'sideMenuBtnContainer',
			menuContainer: 'sideMenuContainer'
		};
		opt = $.extend(defaults, opt);
		var $menuBtn=$(opt.btnContainer);
		var $menuContainer=$(opt.menuContainer);
		if ($menuBtn.length < 1 || $menuContainer.length < 1) return false;

		// Auto assign ids to menuBtn and menuContainer if they do not exist
		if($menuBtn[0].id == '') $menuBtn[0].id="sma_" + smIndex;
		if($menuContainer[0].id=='') $menuContainer[0].id = $menuBtn[0].id + '_menu';
		var $btn = $menuBtn.children('a');
		$btn.addClass('sma-btn').attr('id','sma-btn_'+$menuBtn.attr('id')).attr('role','button')
			.attr('aria-haspopup',true)
			.attr('aria-expanded',false)
			.attr('aria-controls',$menuContainer.attr('id'))
			.attr('aria-owns',$menuContainer.attr('id'));
		$menuContainer.addClass('sma-menu').attr('role','group').attr('aria-hidden',true)
			.attr('aria-labelledby',$menuBtn.children('a').attr('id'));
		applyHandlers = function () {
			//console.log('applyHandlers:sideMenu');
			$btn.on('click', onButtonClick);
			$btn.on('keydown', onButtonKeydown);
			$menuContainer.on('keydown', onMenuKeydown);
		},
		onButtonClick = function(){
			$btn=$(this);
			$menu=$($btn.attr('aria-controls'));
			if($('#pgBody').hasClass('active')){ // menu is open
				$('#pgBody').removeClass('active');
				$btn.attr('aria-expanded', false);
				$menu.attr('aria-hidden', true).trigger("focus");
				setTimeout("$('.flyin').addClass('hide')",1000);
			} else { // menu is closed
				$menu.show();
				$('.flyin').removeClass('hide');
				$('#pgBody').addClass('active');
				$btn.attr('aria-expanded', true)
				$menu.attr('aria-hidden', false).height(document.body.clientHeight);
				$('.main_overlay').height(document.body.clientHeight);
				$('.flyin .tools a[role="button"]').first().trigger("focus");
			}
			return false;
		},
		onButtonKeydown = function(ev) {
			var flag=false,
				$btn=$(ev.target),
				$menu = $("#" + $btn.attr("aria-controls"))
			// on space / down / right, open menu (if not open) and focus on first link
			if (ev.which == keys.space || ev.which == keys.down || ev.which == keys.right) {
				if(!$('#pgBody').hasClass('active')) $btn.trigger("click");
				$('.flyin .tools a[role="button"]').first().trigger("focus");
				flag=true;
			}
			// on esc / up / left close menu if it is open
			if (ev.which == keys.esc || ev.which == keys.up || ev.which == keys.left) {
				$btn.trigger("click");
				$('.flyin .tools a[role="button"]').first().trigger("focus");
			}
			if (flag) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		},
		onMenuKeydown = function(ev) {
		// Unhandled ESC from menu contents - closes side menu
			var $submenu=$(ev.target).closest(".flyin");
			var $btn=$("#" + $submenu.attr("aria-labelledby"));
			if ((ev.which == keys.esc)){
				$btn.trigger("focus").trigger("click");
				ev.stopPropagation();
				ev.preventDefault();
			}
		};
		applyHandlers();
	};
})(jQuery);


// leanModal-AKUSA-v2.0 - derived from
// leanModal v1.1 by Ray Stone - http://finelysliced.com.au
// Dual licensed under the MIT and GPL

(function($){
  $.fn.extend({
    lnModalExt: function(options) {
			console.log('lnModalExt');
      var defaults = {
        top: 100,
        overlay: 0.5,
        closeButton: ".modal_close",
        escapeClose: true,
        clickClose: true,
				modalIdBase: "modalLink_"
      };

      options = $.extend(defaults, options);
			if( $("#lean_overlay").length == 0) {
	      var overlay = $('<div id="lean_overlay"></div>');
	      $('body').append(overlay);
			}

      function close_modal(modal_id){
        var returnFocus = $('#' + $(modal_id).attr("data-opener"));
				// hide the modal and overlay
        $('#lean_overlay').fadeOut(200);
        $(modal_id).css({'display': 'none'});
				// remove keybindings & opener items
				$(document).off('keydown.lnModalExt');
				$(modal_id).removeAttr('data-opener');
        returnFocus.trigger("focus");

      }


      return this.each(function(idx) {
        var o = options,
					$this = $(this);
				// auto assign ids to modal linked items
				if(this.id == '') { this.id = o.modalIdBase + idx ;}
				$this.on("click",function(e) {
          e.preventDefault();
					// Hides other modals, so they don't pile up if opening nested modals
					$('.modal').hide();
					// if this is a link, give it a role=button
					if ( $this.attr('href') ) $this.attr('role', 'button');

					// find a reference to the modal id to display
					// Check aria-controls, rel, href, or class=ext in order for an ID to use
					var modal_id="placeholder",$modal_id;
					console.log("1" + modal_id);
					if ( $this.attr('aria-controls') ) modal_id = '#' + $this.attr('aria-controls');
					console.log("2" + modal_id);

					if ($(modal_id).length == 0 && ($this.attr('rel'))) modal_id = $this.attr('rel');
					console.log("3" + modal_id);
					if(modal_id.indexOf("#") == -1) modal_id = $this.attr('href');
					if(modal_id.indexOf("#") == -1) {
						if($this.hasClass('ext')) modal_id = "#siteExit";
					}
					console.log("4" + modal_id);

					if ($(modal_id).length==0) {
						// Nothing returned a valid modal id, just follow the link
						return true;
					}
					$modal_id = $(modal_id);
					// store a reference to the opener in the data-opener attr of the modal
					$modal_id.attr('data-opener',this.id);
					// set the role to alertdialog based on data attributes on link, else dialog
					if ( $this.attr('data-modal-alert') === 'true' && $modal_id.attr('role') !== 'alertdialog' ) {
						$modal_id.attr('role', 'alertdialog');
					} else {
						$modal_id.attr('role', 'dialog');
					}
					if (o.closeButton) {
						$(o.closeButton).attr('aria-label','Close modal');
            $(o.closeButton).one('click', function(e) {
              close_modal(modal_id);
							e.preventDefault();
            });
          }

          if (o.clickClose) {
            $('#lean_overlay').one('click', function(e) {
              close_modal(modal_id);
							e.preventDefault();
            });
          }

          if (o.escapeClose) {
            $(document).on('keydown.lnModalExt', function(event) {
              if (event.which === 27) {
                close_modal(modal_id);
              }
            });
          }


          var modal_height = $(modal_id).outerHeight();
          var modal_width = $(modal_id).outerWidth();
          $('#lean_overlay').css({'display': 'block', opacity: .5});
          $('#lean_overlay').fadeTo(200, o.overlay);
          $(modal_id).css({
            'display': 'block',
            'position': 'fixed',
            'opacity': 0,
            'z-index': 11000,
            'left': 50 + '%',
            'margin-left': -(modal_width / 2) + 'px',
            'top': o.top + 'px'
          });
          $(modal_id).fadeTo(200,1);


          e.preventDefault();
        });
      });
    }
  });
})(jQuery);

/*
tabSet v1.5.1

Began life as Lightweight semantic jquery tabs by Sam Croft
https://github.com/samcroft/lightweight-semantic-jquery-tabs
http://samcroft.co.uk/2011/lightweight-semantic-jquery-tabs-plugin/

Heavily modified by Jared Noble - Alaska USA - 6/22/2016
 - Auto select current tab based on URL hash
 - only change dl heights when dd floated (to support linearized or mobile view)
 - enable tri-state tabs '' | 'current' | 'closed' (clicked on current)
   this allows linear/mobile to close all tabs to ease navigation (still only 1 current)
 - Autoscan links on page that reference tabs and override their behavior to click tab dt
 - Gracefully bring tabs into view if selected tab is off screen
 - Added ARIA accordion attributes & keyboard navigation support (left/right through tabs)
 - Now supports options for responsive views:
   -- mode(str:normal|linear):
      normal (horizontal tabs) sets the css height on the container dl to match height of tabs and current content
      linear (vertical stack for mobile) does not set css height on dl, allowing stylesheet to handle display (height:auto);
   -- responsive(boolean-default true): When responsive, attaches handler to window.resize to toggle mode between
      normal/linear when crossing the breakpoint width, and set/clear the css height on the dl
   -- breakpoint(int-default 768): If breakpoint is non numeric or < 1 then responsive mode is automatically disabled.

v1.5.0 - 3/6/2017 changed ARIA definition from tabs to accordion.
 - ARIA tab specification is ** BROKEN ** in that it requires that all be the only children
   of a single tablist element - i.e. tabs and tab panels cannot be intermixed as they must
   necessarily be when using a dl element. The sematic appropriateness of the dl is desirable,
   so I am switching to an accordion, despite not being vertically oriented in normal mode.
 - 3/30/2018 JR - Added :visible to left/right/home/end in keydown event
v1.5.1
 - 6/28/2021 JN - Move role=button from .tabSet dt to .tabSet dt a, Do not add role=region to tabSet dd elements
*/
(function($){
	$.fn.tabSet = function(options) {
		var opt = $.extend( {}, $.fn.tabSet.defaults, options );
		// normalize inputs to allowed values
		opt.responsive = (opt.responsive == false || opt.responsive=="false") ? false : true;
		opt.mode = (opt.mode == "linear") ? "linear" : "normal";
		opt.breakpoint = parseInt(opt.breakpoint);
		if (isNaN(opt.breakpoint) || opt.breakpoint < 1) opt.breakpoint = 0;

		this.each(function(tabsIndex) {
			if(this.id == "") this.id="tabSet_" + tabsIndex; // Auto assign id to tabSet if one does not exist
			if (opt.responsive && opt.breakpoint > 0){
				// responsive must be true and breakpoint valid and > 0
				this.responsive = true;
				this.mode = window.innerWidth < opt.breakpoint ? "linear" : "normal";
				this.breakpoint = opt.breakpoint;
			} else {
				// if not responsive or invalid breakpoint (disables responsive), use mode set by user
				this.responsive = false;
				this.mode = opt.mode;
				this.breakpoint = 0;
			}
			var $tabSet = $(this);
			var $tabs = $tabSet.children("dt");
			$tabSet.addClass('enhance');
			$tabs.each( function(index){
				if(this.id == "") this.id=$tabSet.attr("id") + "_" + index; // Auto assign id to submenu if one does not exist
				var $tab = $(this);
            $("a", $tab).attr('aria-expanded', 'false').attr('role','button').attr('aria-controls', this.id + '_panel');
            $tab.next('dd').attr('id',this.id + '_panel').attr('aria-hidden','true')
					.attr('aria-labelledby',this.id);
			});
			$tabSet.find('> dd').hide();
			this.dtHeight = $("dt > a",$tabSet).outerHeight();
			// dd height support for vertical tabs
			if( $tabSet.hasClass("vertical")){
				$tabSet.attr("data-stackheight",($tabs.length * (this.dtHeight )) +  parseInt($tabSet.css("border-top-width")) + parseInt($tabSet.css("border-bottom-width")));
				if( window.innerWidth < this.breakpoint){
					$("dd",$tabSet).css("min-height",$tabSet.attr("auto"));
				} else {
					$("dd",$tabSet).css("min-height",parseInt($tabSet.attr("data-stackheight")));
				}
			}
			var current;

			var hash = location.hash;
			// set the current tab - current page hash if it matches, else the first tab
			if ($tabSet.find('dt > a[href="'+hash+'"]').length) {
				current = $tabSet.find('a[href="'+hash+'"]').parent();
			} else {
				current = $tabSet.find('dt:first');
			}
			current.addClass('current').children('a').attr('aria-expanded','true');
			current.next('dd').attr('aria-hidden','false');
			var currentHeight = current.next('dd').show().outerHeight();
			// only change dl height when the tabs are floated or mode set to normal (normal view instead of linearized / mobile view)
			if ($(current).css("float") != "" && $(current).css("float") != "none" || this.mode == "normal") {
				$tabSet.css('height', this.dtHeight + currentHeight);
			}
		});
		$(window).on("resize",function(ev){
			var w=window.innerWidth;
			$("dl.tabSet").each(function(){
				if (!this.responsive) return true;
				var $dl = $(this);
				if(this.mode == 'normal'){
					if (window.innerWidth < this.breakpoint){
						$dl.removeAttr('style');
						$('dd',$dl).css('min-height','auto');
						$dl.children('dt.closed').children('a').attr('aria-expanded','false').end()
							.next('dd').attr('aria-hidden','true');
						this.mode = "linear";
//						console.log("switch to linear");
					}
				} else { // mode=linear - switch to normal - might be vertical doesn't mean anything in this case
					if (window.innerWidth >= this.breakpoint){
//						$dl.children('dt.closed').children('a').attr('aria-expanded','true').end()
//							.next('dd').attr('aria-hidden','false');
						if ($dl.hasClass('vertical')){
							$dl.removeAttr('style').children('dd').css('min-height',parseInt($dl.attr('data-stackheight')));
						} else {
							var DDHeight = $dl.children('dt.current,dt.closed').next('dd').outerHeight(),
								DTHeight = $dl.children('dt').outerHeight();
							$dl.css('height',(DTHeight + DDHeight)).children("dd[aria-hidden='false']").css('min-height','auto');
						}

//						console.log("currentHeight:" + currentHeight);
//						console.log("stackheight:" + $dl.attr("data-stackheight"));
//						$dl.css('height', this.dtHeight + currentHeight);
//						$dl.css("minHeight",$dl.attr("data-stackheight"));
//						console.log("dd count:" + $("dd",$dl).length);
						this.mode = "normal";
//						console.log("switch to normal");
					}
				}
			});
		});

		// override click behavior on dt a links
		$('dl.enhance dt a[role="button"]').on("click",function(e){
			e.preventDefault();
			var $dl = $(this).closest('dl'),
					$tab = $(this).parent('dt'),
					dtHeight = $tab.outerHeight();
			// Tri-state for linearized tabs (mobile presentation) - Current becomes closed on click.
			// Hiding closed dd is the job of the css.
			if($tab.hasClass('current')){
				$tab.removeClass('current').addClass('closed');
				//console.log("this:" + this);
				if($dl[0].mode=="linear"){
//					console.log("mode:" + $dl[0].mode);
					$tab.children('a').attr('aria-expanded','false');
					$tab.next('dd').attr('aria-hidden','true');
				}
			} else {
				// clear existing closed or current element
				$dl.find('dt.closed,dt.current').removeClass('closed current')
				.children('a').attr('aria-expanded','false').end()
				.next('dd').attr('aria-hidden','true').hide();
				// make the selected tab current and focus it
				$tab.addClass('current').children('a').attr('aria-expanded','true');
			}
			// show the dd for the selected tab and get the height
			var currentHeight = $tab.next('dd').show().attr('aria-hidden','false').outerHeight();
			// only change height when the tabs are floated (normal view instead of linearized / mobile view)
			if ($tab.css("float") != "" && $tab.css("float") != "none") {
				$tab.parents('dl').css('height', dtHeight + currentHeight);
			}
			if(history.pushState) {
				history.pushState(null, null, $(this).attr('href'));
// Disable hash based state updates, since this breaks IE 8 (as expected)
//			} else {
//				location.hash = $(this).attr('href');
			}
		});

		$('dl.enhance dt a[role="button"]').on("keydown",function(ev) {
			// keycode values
			var curtab = $(this).closest("dt")
			var keys = { tab:9, enter:13, esc:27, space:32, pageup:33, pagedown:34,
			 end:35, home:36, left:37, up:38, right:39, down:40 }
			// keyboard activation of focused tabs on (enter or space)
			if (ev.which == keys.enter || ev.which == keys.space) {
				$(this).trigger("click").trigger("focus");
			}
			// keyboard (37:left/39:right/36:home/35:end) navigation through the tabs when a tab is selected.
			if ((ev.which == keys.left)||(ev.which == keys.right)||(ev.which ==keys.home)||(ev.which ==keys.end)) {
				if (ev.which==keys.left && curtab.prevAll("dt:visible").length > 0){
                    curtab.prevAll("dt:visible").first().children("a").trigger("click").trigger("focus");
				}
                if (ev.which == keys.right && curtab.nextAll("dt:visible").length > 0){
                    curtab.nextAll("dt:visible").first().children("a").trigger("click").trigger("focus");
				}
                if (ev.which == keys.home && curtab.prevAll("dt:visible").length > 0){
                    curtab.prevAll("dt:visible").last().children("a").trigger("click").trigger("focus");
				}
                if (ev.which == keys.end && curtab.nextAll("dt:visible").length > 0){
                    curtab.nextAll("dt:visible").last().children("a").trigger("click").trigger("focus");
				}
			}
		});

		// Override click behavior on links to tab elements on this page
		// this allows links in nav, etc. to activate tabs just like actually clicking a tab.
		$("a[href^='" + window.location.pathname + "']").not(".tabSet > dt > a").on("click",function(e) {
			// early exit if pathname doesn't match current page or if hash is empty, or search value differs
			if($(this)[0].pathname != window.location.pathname || $(this)[0].hash =="" || $(this)[0].search != window.location.search) {return true;}
			var h = $(this)[0].hash;
			var tabs = $('dl.enhance dt');
			for(var i=0; i < tabs.length; i++ ){
				// if link hash matches a tab id do not navigate
				if(h == "#" + tabs[i].id){
					e.preventDefault;
					// close mobile flyin menu if visible (AKUSA specific)
					$("#pgBody").removeClass("active");
					var t = $("#" + tabs[i].id);
					t.children("a").trigger("click");
					// If tab not in view, slide it in (instead of jumping per normal # links)
					if(t.offset().top < window.scrollY || t.offset().top > window.innerHeight) {
						var newTop = t.offset().top - 50;
						if(newTop < 0) { newTop = 0; }
						$("html, body").animate({
							scrollTop: newTop
						},500);
					}
					// Close the main nav menu if that is where the link was selected (AKUSA specifc)
					$(this).parents("ul.menu").css("display","none").parents(".sfHover").removeClass("sfHover");
				}
			};
			return false;
		});
	}
	// Plugin defaults - responsive with 768px breakpoint to turn linear.
	$.fn.tabSet.defaults = {
		responsive: true, /* boolean */
		mode: "normal", /* normal or linear */
		breakpoint: 768
	};
})(jQuery);



/*
 Angelfish(tm) asynchronous tracking code for websites.
 Copyright (c) 2015 Actual Metrics. All Rights Reserved.
 http://www.angelfishstats.com
 v20150731.01
*/
var o=!0,p=null,v=!1;Array.prototype.indexOf||(Array.prototype.indexOf=function(s,q){var m=this.length>>>0,e=Number(q)||0,e=0>e?Math.ceil(e):Math.floor(e);for(0>e&&(e+=m);e<m;e++)if(e in this&&this[e]===s)return e;return-1});var M="040";
(function(s,q,m,e,N){function I(a){if(!a||!a.url)return o;var b=escape(a.q?a.q:e.i),b=b+("="+d.visitorId+"."+d.visitStartTime),b=b+("."+l(f.source.replace(/\&/g,""))+"%26"+l(f.medium.replace(/\&/g,""))+"%26"+l(f.campaign.replace(/\&/g,""))+"%26"+l(f.keyword.replace(/\&/g,""))+"%26"+l(f.content.replace(/\&/g,"")));return a.url.indexOf("?")>0?a.url+"&"+b:a.url+"?"+b}function l(a){return encodeURIComponent(decodeURIComponent(a.toString()))}function B(a,b){if(a&&!(a.length===0||typeof b!=="function"))for(var c in a)if(a.hasOwnProperty(c)&&
b(c)===v)break}function C(a,b,c,n){var t=a+"="+D(e.d!="auto"?e.d:q.domain)+"."+b+";";if(c){if(c!=="session"){var d="";if(n){d=new Date;d.setTime(d.getTime()+n*(c==="min"?6E4:864E5));d=d.toUTCString()}t=t+("expires="+d+";")}}else t=t+"expires=Thu, 01-Jan-1970 00:00:01 GMT;";e.j&&(t=t+("path="+e.j+";"));e.d!="auto"&&(t=t+("domain="+e.d+";"));q.cookie=t;r[a]=b}function w(){return Math.ceil((new Date).getTime()/1E3)}function z(){var a=(f.keyword||"").replace(/\&/g,""),a=f.ie?a:l(a),a=d.visitorId+"&"+
d.visitStartTime+"&"+d.lastActivityTime+"&"+l((f.source||"").replace(/\&/g,""))+"&"+l((f.medium||"").replace(/\&/g,""))+"&"+l((f.campaign||"").replace(/\&/g,""))+"&"+a+"&"+l((f.content||"").replace(/\&/g,""))+"&"+l((d.referrer||"").replace(/\&/g,""))+"&"+l((d.username||"").replace(/\&/g,""));C(e.e.sessionInfo,a,"day",e.w);r[e.e.sessionTimeout]||J()}function J(){C(e.e.sessionTimeout,d.visitorId,"session")}function O(){if(!r[e.e.sessionInfo]){d.visitorType="new";return v}var a=r[e.e.sessionInfo].split("&");
if(a[0]=="undefined"){d.visitorType="new";return v}d.visitorId=a[0];d.visitorType="returning";d.visitStartTime=parseInt(a[1],10);d.visitId=l(d.visitorId+(d.visitStartTime?d.visitStartTime:w()).toString());d.lastActivityTime=a[2];d.referrer=a[8];d.username=a[9];f.source=a[3];f.medium=a[4];f.campaign=a[5];f.keyword=a[6];f.content=a[7];if(r[e.e.userDefined]){a=r[e.e.userDefined].split("&");a[0]==d.visitId&&(d.userDefined=a[1])}else d.userDefined=p;return o}function P(){if(!x[e.i])return v;var a,b,c,
n;a=x[e.i];b=a.indexOf(".");if(b>0)c=a.substring(0,b);else return v;n=a.indexOf(".",b+1);if(n>0)b=a.substring(b+1,n);else return v;a=a.substr(n+1);a=a.split("&");if(a.length!=5)return v;d.visitorId=c;d.visitStartTime=b;d.visitId=l(d.visitorId+(parseInt(d.visitStartTime,10)?parseInt(d.visitStartTime,10):w()).toString());f.source=unescape(a[0]);f.medium=unescape(a[1]);f.campaign=unescape(a[2]);f.keyword=unescape(a[3]);f.content=unescape(a[4]);return o}function E(){P()||(O()?parseInt(d.lastActivityTime,
10)+e.o*60<w()?A():r[e.e.sessionTimeout]||A():A());d.lastActivityTime=w();z()}function A(){if(!d.visitorId){var a=0,b;for(b=0;b<y.hostname.length;b++)a=a+y.hostname.charCodeAt(b);d.visitorId=l((a+Math.floor(Math.random()*1E8)).toString());J()}d.visitStartTime=w();d.lastActivityTime=d.visitStartTime;d.visitId=l(d.visitorId+(d.visitStartTime?d.visitStartTime:w()).toString());d.pageviewCount=0;delete d.username;if(e.u!==1||!f.source){a=Q();f=a.campaign;d.referrer=a.referrer}}function K(a){if(!a)return{hostname:"",
queryParams:[],stem:""};var b,c,n,e="",d=[];b=a.indexOf("://");if(b===-1)return{r:v};b=b+3;c=a.indexOf("/",b);if(c===-1){c=a.indexOf("?",b);if(c===-1)n=a.substring(b);else{n=a.substring(b,c);d=a.substring(c+1).split("&")}}else{n=a.substring(b,c);b=c+1;c=a.indexOf("?",b);if(c>-1){e=a.substring(b,c);d=a.substr(c+1).split("&")}else e=a.substr(b)}if((b=n.indexOf(":"))>-1)n=n.substring(0,b);return{hostname:n,queryParams:d,stem:"/"+e}}function L(a){var b,c="",n=v,d,f,m,k,l;if(!a)return{r:v};var q=K(a);
f=q.hostname;m=q.queryParams;c=f;f=f.split(".");if(f.length===0)return{r:v};for(a=0;a<f.length-1;a++){d=f[a];if(e.f[d]){c=a+1<f.length?d+"."+f[a+1]:d;n=o;k=F[d.toLowerCase()]?d.toLowerCase():v;l=v;B(m,function(a){a=m[a].split("=");if(k&&a[0]===F[k].B){l=a[1].toLowerCase();if(b)return v}if(a[0]===e.f[d]){c=d;b=a[1];if(!k||l)return v}return o});k&&!l&&(l=F[k]["default"]);if(b&&(!k||l=="utf8"||l=="utf-8")){b=decodeURIComponent(b);l=k=v}}}if(n&&b!=p){n={r:n,kw:b,hn:c};if(l)n.h=l;return n}return n&&f.join(".").match(/search\.yahoo\.com$/i)?
{r:n,hn:"yahoo",kw:"(not provided)"}:{r:n,hn:q.hostname}}function Q(){var a={campaign:{},referrer:""},b=q.referrer.replace(/\+/g,"%20"),c=K(q.referrer.replace(/\+/g,"%20")),n,t,m,l={};for(n in e.g)if(e.g.hasOwnProperty(n)!=v){l[n]=p;for(t in e.g[n])if(e.g[n].hasOwnProperty(t)!=v){m=e.g[n][t];if(x[m]){l[n]=x[m];break}}}if(l.source&&l.medium&&l.campaign){a.campaign={source:l.source,medium:l.medium,campaign:l.campaign,keyword:"",content:l.content||""};if(l.keyword)a.campaign.keyword=l.keyword;else{b=
L(b);b.r&&typeof b.kw==="string"&&(a.campaign.keyword=b.kw)}a.referrer=c.hostname&&c.hostname==s.location.hostname?"":c.stem}else{if(e.sourceOverwrite===0&&f.source&&f.medium)return{campaign:f,referrer:d.referrer};a.referrer=c.hostname&&c.hostname==s.location.hostname?"":c.stem;b=L(b);if(b.hn&&(b.hn==s.location.hostname||e.d&&e.d!="auto"&&b.hn.match(RegExp(e.d+"$")))){f.source||(f.source="direct");f.medium||(f.medium="(none)");f.campaign||(f.campaign="");f.keyword||(f.keyword="");f.content||(f.content=
"");d.referrer||(d.referrer="");return{campaign:f,referrer:d.referrer}}if(b.r&&b.hn==="google"&&typeof x.gclid==="string")a.campaign={source:"google",medium:"cpc",campaign:"adwords",keyword:b.kw,content:""};else if(b.r)if(typeof b.kw==="string"){a.campaign={source:b.hn,medium:"organic",campaign:"(organic)",keyword:b.kw||"(not provided)",content:""};if(b.h)a.campaign.h=b.h}else a.campaign={source:b.hn,medium:"referral",campaign:"(referral)",keyword:"",content:""};else a.campaign=b.hn?{source:b.hn,
medium:"referral",campaign:"(referral)",keyword:"",content:""}:{source:"direct",medium:"(none)",campaign:"",keyword:"",content:""}}a.campaign.h||(a.campaign.keyword=a.campaign.keyword.toLowerCase());return a}function R(a){var b,c=[];b=e.l==="auto"?y.protocol+"//":e.l?"https://":"http://";b=b+(e.n=="auto"?s.location.host:e.n);b=b+e.p;a.vi=d.visitorId;a.vs=d.visitId;a._=Math.floor(Math.random()*1E6);a.v=M;B(e.k,function(a){a=e.k[a];r[a]&&c.push(l(a+"="+r[a]))});a.ck=c.join(";");c=p;b=b+("?"+S(a));b.replace(/%20/g,
"+");return b}function S(a){var b=[];B(a,function(c){a[c]&&(c=="ie"||c=="kw"&&a.h?b.push(c+"="+a[c]):b.push(l(c)+"="+l(a[c])))});return b.join("&")}function T(){if(!m||!m.userAgent)return{name:p,version:p};var a=m.userAgent,b=m.platform,c;if((c=a.match(/Windows\sNT\s(\d+\.\d+)/i))&&c.length>0){a=parseFloat(c[1]);return a===5?{name:"Windows",version:2E3}:a===5.1?{name:"Windows",version:"XP"}:a===5.2?{name:"Windows",version:"XP Professional"}:a===6?{name:"Windows",version:"Vista"}:a===6.1?{name:"Windows",
version:7}:a===6.2?{name:"Windows",version:8}:a===6.3?{name:"Windows",version:8.1}:a===10?{name:"Windows",version:10}:{name:"Windows",version:a||"-"}}if((c=a.match(/Windows\sPhone\s(\d+\.\d+)/i))&&c.length>0)return{name:"Windows Phone",version:parseFloat(c[1])};if((c=a.match(/(iPod|iPad|iPhone).*?OS\s([0-9\_]+)/i))&&c.length>0)return{name:c[1],version:c[2].replace(/_/g,".")};if(a.indexOf("PSP (PlayStation Portable)")>-1)return{name:"PSP"};if(a.indexOf("PLAYSTATION 3")>-1)return{name:"Playstation 3"};
if(a.toLowerCase().indexOf("xbox")>-1)return{name:"XBox"};if(a.toLowerCase().indexOf("googletv")>-1)return{name:"Google TV"};if((c=a.match(/Android\s(\d+\.\d+)/i))&&c.length>0){a=parseFloat(c[1]);return{name:"Android",version:a}}if((c=a.match(/BlackBerry[0-9]{4}[a-zA-Z]?\/([.0-9]+)/i))&&c.length>0)return{name:"BlackBerry",version:c[1]};if((c=a.match(/(BlackBerry|BB10).*Version\/([.0-9]+)/i))&&c.length>0)return{name:"BlackBerry",version:c[2]};if((c=a.match(/CrOS\s\S+\s([0-9.]+)/i))&&c.length>0)return{name:"Chrome OS",
version:c[1]};if((c=b.match(/Linux\s(.+)/i))&&c.length>0)return{name:"Linux",version:c[1]};return(c=a.match(/Mac OS\s?X ((\d\.?)+)/i))&&c.length>0?{name:"Mac OS X",version:c[1]}:{name:b}}function D(a){function b(a,b){var c,d,e,f,g;e=a&2147483648;f=b&2147483648;c=a&1073741824;d=b&1073741824;g=(a&1073741823)+(b&1073741823);return c&d?g^2147483648^e^f:c|d?g&1073741824?g^3221225472^e^f:g^1073741824^e^f:g^e^f}function c(a,c,d,e,f,g,h){a=b(a,b(b(c&d|~c&e,f),h));return b(a<<g|a>>>32-g,c)}function d(a,c,
e,f,g,h,i){a=b(a,b(b(c&f|e&~f,g),i));return b(a<<h|a>>>32-h,c)}function e(a,c,d,f,g,h,i){a=b(a,b(b(c^d^f,g),i));return b(a<<h|a>>>32-h,c)}function f(a,c,d,e,g,h,i){a=b(a,b(b(d^(c|~e),g),i));return b(a<<h|a>>>32-h,c)}function m(a){var b="",c="",d;for(d=0;d<=3;d++){c=a>>>d*8&255;c="0"+c.toString(16);b=b+c.substr(c.length-2,2)}return b}var k=[],l,q,s,r,g,h,i,j,a=function(a){for(var a=a.replace(/\r\n/g,"\n"),b="",c=0;c<a.length;c++){var d=a.charCodeAt(c);if(d<128)b=b+String.fromCharCode(d);else{if(d>
127&&d<2048)b=b+String.fromCharCode(d>>6|192);else{b=b+String.fromCharCode(d>>12|224);b=b+String.fromCharCode(d>>6&63|128)}b=b+String.fromCharCode(d&63|128)}}return b}(a),k=function(a){var b,c=a.length;b=c+8;for(var d=((b-b%64)/64+1)*16,e=Array(d-1),f=0,g=0;g<c;){b=(g-g%4)/4;f=g%4*8;e[b]=e[b]|a.charCodeAt(g)<<f;g++}b=(g-g%4)/4;e[b]=e[b]|128<<g%4*8;e[d-2]=c<<3;e[d-1]=c>>>29;return e}(a);g=1732584193;h=4023233417;i=2562383102;j=271733878;for(a=0;a<k.length;a=a+16){l=g;q=h;s=i;r=j;g=c(g,h,i,j,k[a+0],
7,3614090360);j=c(j,g,h,i,k[a+1],12,3905402710);i=c(i,j,g,h,k[a+2],17,606105819);h=c(h,i,j,g,k[a+3],22,3250441966);g=c(g,h,i,j,k[a+4],7,4118548399);j=c(j,g,h,i,k[a+5],12,1200080426);i=c(i,j,g,h,k[a+6],17,2821735955);h=c(h,i,j,g,k[a+7],22,4249261313);g=c(g,h,i,j,k[a+8],7,1770035416);j=c(j,g,h,i,k[a+9],12,2336552879);i=c(i,j,g,h,k[a+10],17,4294925233);h=c(h,i,j,g,k[a+11],22,2304563134);g=c(g,h,i,j,k[a+12],7,1804603682);j=c(j,g,h,i,k[a+13],12,4254626195);i=c(i,j,g,h,k[a+14],17,2792965006);h=c(h,i,j,
g,k[a+15],22,1236535329);g=d(g,h,i,j,k[a+1],5,4129170786);j=d(j,g,h,i,k[a+6],9,3225465664);i=d(i,j,g,h,k[a+11],14,643717713);h=d(h,i,j,g,k[a+0],20,3921069994);g=d(g,h,i,j,k[a+5],5,3593408605);j=d(j,g,h,i,k[a+10],9,38016083);i=d(i,j,g,h,k[a+15],14,3634488961);h=d(h,i,j,g,k[a+4],20,3889429448);g=d(g,h,i,j,k[a+9],5,568446438);j=d(j,g,h,i,k[a+14],9,3275163606);i=d(i,j,g,h,k[a+3],14,4107603335);h=d(h,i,j,g,k[a+8],20,1163531501);g=d(g,h,i,j,k[a+13],5,2850285829);j=d(j,g,h,i,k[a+2],9,4243563512);i=d(i,j,
g,h,k[a+7],14,1735328473);h=d(h,i,j,g,k[a+12],20,2368359562);g=e(g,h,i,j,k[a+5],4,4294588738);j=e(j,g,h,i,k[a+8],11,2272392833);i=e(i,j,g,h,k[a+11],16,1839030562);h=e(h,i,j,g,k[a+14],23,4259657740);g=e(g,h,i,j,k[a+1],4,2763975236);j=e(j,g,h,i,k[a+4],11,1272893353);i=e(i,j,g,h,k[a+7],16,4139469664);h=e(h,i,j,g,k[a+10],23,3200236656);g=e(g,h,i,j,k[a+13],4,681279174);j=e(j,g,h,i,k[a+0],11,3936430074);i=e(i,j,g,h,k[a+3],16,3572445317);h=e(h,i,j,g,k[a+6],23,76029189);g=e(g,h,i,j,k[a+9],4,3654602809);j=
e(j,g,h,i,k[a+12],11,3873151461);i=e(i,j,g,h,k[a+15],16,530742520);h=e(h,i,j,g,k[a+2],23,3299628645);g=f(g,h,i,j,k[a+0],6,4096336452);j=f(j,g,h,i,k[a+7],10,1126891415);i=f(i,j,g,h,k[a+14],15,2878612391);h=f(h,i,j,g,k[a+5],21,4237533241);g=f(g,h,i,j,k[a+12],6,1700485571);j=f(j,g,h,i,k[a+3],10,2399980690);i=f(i,j,g,h,k[a+10],15,4293915773);h=f(h,i,j,g,k[a+1],21,2240044497);g=f(g,h,i,j,k[a+8],6,1873313359);j=f(j,g,h,i,k[a+15],10,4264355552);i=f(i,j,g,h,k[a+6],15,2734768916);h=f(h,i,j,g,k[a+13],21,1309151649);
g=f(g,h,i,j,k[a+4],6,4149444226);j=f(j,g,h,i,k[a+11],10,3174756917);i=f(i,j,g,h,k[a+2],15,718787259);h=f(h,i,j,g,k[a+9],21,3951481745);g=b(g,l);h=b(h,q);i=b(i,s);j=b(j,r)}return(m(g)+m(h)+m(i)+m(j)).toLowerCase()}String.prototype.trim=function(){return this.replace(/^[\s\xA0]+/,"").replace(/[\s\xA0]+$/,"")};var G=o,d={},f={},r={},x={agfoff:0,agf_off:0,gclid:p},y=q.location,H=1,F={baidu:{"default":"gb2312",parameter:"ie"},google:{"default":"utf-8",parameter:"ie"}};s[N]={enable:function(){return G=
o},disable:function(){G=v;return o},setUsername:function(a){if(typeof a==="undefined")return v;d.username=a;z();return o},setTrackingFile:function(a){if(!a)return v;e.p=a;return o},setTrackingHost:function(a){if(!a)return v;e.n=a;return o},setCookiePath:function(a){if(!a)return v;e.j=a;return o},setCookieDomain:function(a){if(!a)return v;e.d=a;var b,c,d=RegExp(D(e.d!="auto"?e.d:q.domain)+"\\.");b=q.cookie.split(";");for(a=0;a<b.length;a++){c=b[a].split("=");if(c.length==2&&c[1].match(d)){c[1]=c[1].replace(d,
"");var f=r,m=c[0].trim();c=c[1].trim();f[m]=decodeURIComponent(c)}}E();return o},setQueryDelimiter:function(a){if(!a||a!="?"&&a!="#")return v;e.m=a;return o},putCookiesInQuery:function(a){if(typeof a!="object"||!a.length)return v;e.k=a;return o},setHttps:function(a){if(typeof a!="boolean"&&a!="auto")return v;e.l=a;return o},addOrganicReferrer:function(a,b){if(!a||!b)return v;e.f[a]=b;return o},removeOrganicReferrer:function(a){if(!a||!e.f[a])return v;delete e.f[a];return o},addQueryExclude:function(a){if(!a)return v;
e.s.push(a);return o},pageview:function(a){typeof a!="object"&&(a={});parseInt(d.lastActivityTime,10)+e.o*60<w()&&E();var b,c,n;b=a.page||y.pathname;n=b.indexOf(e.m);n>0&&(b=b.substr(0,n));(c=e.m)||(c="?");n=c=="?"?"#":"?";var l=a.page||y.href;c=l.lastIndexOf(c);if(c>0){l=l.substr(c+1);l=l.split(n);n=l[0]}else n="";b={t:"pv",pv:b,tt:a.title||q.title,qr:n};"username"in d&&typeof d.username!=="undefined"&&(b.un=d.username);b.vt=d.visitorType;b.udv=d.userDefined;b.rp=d.referrer;b.sc=f.source;b.md=f.medium;
b.cp=f.campaign;b.kw=f.keyword;b.cn=f.content;f.ie&&(b.ie=f.ie);n=b;m&&(n.je=m.javaEnabled()?1:0);if(s&&s.screen){n.dp=s.screen.colorDepth;n.sh=s.screen.height;n.sw=s.screen.width}l=n=p;if(m&&m.userAgent)for(var u=[{source:m.userAgent,a:/BlackBerry[0-9]+.*MIDP/,c:"MIDP",b:"BlackBerry"},{source:m.userAgent,a:/BlackBerry|BB10/,c:"AppleWebKit",b:"BlackBerry"},{source:m.userAgent,a:/Version\/[.0-9]+ Mobile(\/[.A-Za-z0-9]+)? Safari/,c:"Version",b:"Mobile Safari"},{source:m.userAgent,a:/IEMobile\/[.0-9]+/,
c:"IEMobile",b:"Internet Explorer Mobile"},{source:m.userAgent,a:/Mobile.+Edge\/[.0-9]+/,c:"Edge",b:"Microsoft Edge Mobile"},{source:m.userAgent,a:/Chrome\/[.0-9]+ Mobile Safari\//,c:"Chrome",b:"Chrome Mobile"},{source:m.userAgent,a:/CriOS\/[.0-9]+ Mobile/,c:"CriOS",b:"Chrome Mobile"},{source:m.userAgent,a:/Opera Mobi\//,c:"Version",b:"Opera Mobile"},{source:m.userAgent,a:/Opera Mini\//,c:"Version",b:"Opera Mini"},{source:m.userAgent,a:/Mobile; rv:[.0-9]+\) Gecko\/[.0-9]+ Firefox\/[.0-9]+/,c:"Firefox",
b:"Mobile Firefox"},{source:m.userAgent,a:/Edge\/[.0-9]+/,c:"Edge",b:"Microsoft Edge"},{source:m.userAgent,a:/Chrome\/[.0-9]+ Safari\//,c:"Chrome",b:"Chrome"},{source:m.userAgent,a:/rekonq\/[.0-9]+ Safari\//,c:"rekonq",b:"Rekonq"},{source:m.userAgent,a:/OmniWeb/,c:"OmniWeb/",b:"OmniWeb"},{source:m.userAgent,a:/Version\/[.0-9]+ Safari\//,c:"Version",b:"Safari"},{source:m.userAgent,a:/Opera\/[.0-9]+/,c:"Version",b:"Opera"},{source:m.userAgent,a:/iCab\/[.0-9]+/,c:"iCab",b:"iCab"},{source:m.userAgent,
a:/Konqueror\/[.0-9]+/,c:"Konqueror",b:"Konqueror"},{source:m.userAgent,a:/Firefox\/[.0-9]+/,c:"Firefox",b:"Firefox"},{source:m.userAgent,a:/Camino\/[.0-9]+/,c:"Camino",b:"Camino"},{source:m.userAgent,a:/Netscape\/[.0-9]+/,c:"Netscape",b:"Netscape"},{source:m.userAgent,a:/MSIE/,c:"MSIE",b:"Internet Explorer"},{source:m.userAgent,a:/Trident\/[.0-9]+/,c:"rv",b:"Internet Explorer"},{source:m.userAgent,a:/Gecko\/[.0-9]+/,c:"rv",b:"Mozilla"},{source:m.userAgent,a:/YaBrowser\/[.0-9]+/,c:"YaBrowser",b:"Yandex"}],
r=0;r<u.length;r++){var k=u[r].source;c=u[r].c;if(k&&k.match(u[r].a))n=u[r].b;if(n){u=m.userAgent.indexOf(c);if(u==-1){u=m.appVersion.indexOf(c);u!=-1&&(l=parseFloat(m.appVersion.substring(u+c.length+1)))}else l=parseFloat(m.userAgent.substring(u+c.length+1));break}}c=T();b.bn=n;b.bv=l;b.pn=c.name;if(c.version)b.pr=c.version;b.bl=m.language?m.language.toLowerCase():m.userLanguage?m.userLanguage.toLowerCase():"";b.js=H;b.hn=y.hostname||"-";n=b=R(b);if(G){l=typeof XDomainRequest!=="undefined"?new XDomainRequest:
new XMLHttpRequest;l.open("GET",n.replace(/%20/g,"+"));l.send()}if(typeof a.callback=="function"){n=a.callback;delete a.callback;a.hit=b;n(a)}d.pageviewCount++;d.lastActivityTime=w();z();return o},setUserDefined:function(a){if(typeof a!="object"||!("udv"in a))return v;a.udv===void 0&&(a.udv="");d.userDefined=a.udv;a=d.visitId+"&"+l(d.userDefined.replace(/\&/g,""));C(e.e.userDefined,a,"day",180);return o},getVisitInfo:function(){return d?d:{}},getMarketingVariables:function(){return f?f:{}},saveMarketingVariables:function(a){a.source&&
(f.source=a.source);a.medium&&(f.medium=a.medium);a.campaign&&(f.campaign=a.campaign);a.keyword&&(f.keyword=a.keyword);a.content&&(f.content=a.content);f.source||(f.source="");f.medium||(f.medium="");f.campaign||(f.campaign="");f.keyword||(f.keyword="");f.content||(f.content="");z();return o},resetVisit:function(){A();z();return o},setTransferQuery:function(a){if(a){e.i=a;return o}return v},getTransferUrl:I,transferVisitor:function(a){if(!a||!a.url)return o;s.location=I(a);return v},setJSVersion:function(a){if(a&&
!isNaN(a)&&a>H){H=parseFloat(a);return o}return v}};(function(){var a=y.search.substring(1).split("&"),b,c,d=RegExp(D(e.d!="auto"?e.d:q.domain)+"\\."),f=[e.e.sessionInfo,e.e.sessionTimeout,e.e.userDefined];c=e.f.split(",");e.f={};for(b=0;b<c.length;b++){var l=c[b].split(":");e.f[l[0].trim()]=l[1].trim()}for(b=0;b<a.length;b++){c=a[b].split("=");x[c[0]]=decodeURIComponent(c[1])}if(x.A||x.z)return v;a=q.cookie.split(";");for(b=0;b<a.length;b++){c=a[b].split("=");if(c.length==2&&(f.indexOf(c[0].trim())==
-1||c[1].match(d))){c[1]=f.indexOf(c[0].trim())==-1?c[1]:c[1].replace(d,"");var l=r,m=c[0].trim();c=c[1].trim();l[m]=decodeURIComponent(c)}}b=[1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9];for(d=0;d<b.length;d++){f=q.getElementsByTagName("script")[0];a=q.createElement("script");a.setAttribute("Language","Javascript"+b[d]);a.text="agf.setJSVersion("+b[d]+")";f.parentNode.insertBefore(a,f)}return o})()&&E()})(window,document,navigator,{p:"/agf.gif",n:"auto",m:"?",k:[],l:"auto",f:"google:q,yahoo:p,msn:q,aol:q,lycos:query,ask:q,altavista:q,bing:q,netscape:query,cnn:query,looksmart:qt,about:terms,mamma:query,alltheweb:q,gigablast:q,voila:rdata,virgilio:qs,live:q,baidu:wd,alice:qs,yandex:text,najdi:q,club-internet:q,mama:query,seznam:q,search:q,wp:szukaj,onet:qt,netsprint:q,google.interia:q,szukacz:q,yam:k,pchome:q,duckduckgo:q",
s:[],g:{source:["agfs"],medium:["agfm"],campaign:["agfc"],keyword:["agfk"],content:["agfr"]},u:2,e:{sessionInfo:"agfs",sessionTimeout:"agft",userDefined:"agfudv"},j:"/",d:"auto",o:30,w:180,i:"agfv"},"agf");

/*
 jquery :focusable selector
    $('#my-container').find(':focusable')
 References:
    https://stackoverflow.com/questions/7668525/is-there-a-jquery-selector-to-get-all-elements-that-can-get-focus
    https://coderwall.com/p/jqsanw/jquery-find-every-focusable-elements
*/
jQuery.extend(jQuery.expr.pseudos, {
    focusable: function (el, index, selector) {
        //return $(el).is('a, button, :input, [tabindex]');
        element = el;
        var map, mapName, img,
            nodeName = element.nodeName.toLowerCase(),
            isTabIndexNotNaN = !isNaN($.attr(element, "tabindex"));
        if ("area" === nodeName) {
            map = element.parentNode;
            mapName = map.name;
            if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") {
                return false;
            }
            img = $("img[usemap=#" + mapName + "]")[0];
            return !!img && visible(img);
        }
        return (/input|select|textarea|button|object/.test(nodeName) ?
            !element.disabled :
            "a" === nodeName ?
                element.href || isTabIndexNotNaN :
                isTabIndexNotNaN) &&
            // the element and all of its ancestors must be visible
            visible(element);

        function visible(element) {
            return $.expr.filters.visible(element) &&
                !$(element).parents().addBack().filter(function () {
                    return $.css(this, "visibility") === "hidden";
                }).length;
        }
    }
});
