// leanModal-AKUSA-v2.0 - derived from
// leanModal v1.1 by Ray Stone - http://finelysliced.com.au
// Dual licensed under the MIT and GPL

// fixes closing on click on https://gist.github.com/ctalkington/4093995
// and hides all modals before opening a new one so they don't pile up

// AKUSA updates:
// JR (top=center logic) JN
// Includes updates by JN.
// - Test for existence of lean_overlay before adding another
// - allow either link href or rel attribute to contain the modal id reference:
//    Links can have valid href and work without JS.
//    If neither begins with # cancel the modal display and just follow the href.
// v2 updates by JN
// - Capture triggering element and return focus to it after modal dismissal
// - add aria-label to modal close button
// - update modal_id selection logic
// - automatically create id's for opening links if absent
// v2.1 updates by JN
// - focus handling (on activate, focus on first item in modal, keep focus in modal, on close, focus on triggering element)

var leanModal_pageUsageCount = 0;

(function($){
    $.fn.extend({
      lnModalExt: function (options) {
          leanModal_pageUsageCount++;
//			console.log('lnModalExt');
			var defaults = {
				top: "center",
				overlay: 0.5,
				closeButton: ".modal_close",
				escapeClose: true,
				clickClose: true,
                modalIdBase: "modalLink_" + leanModal_pageUsageCount + "_",
				modalViewportPadding: 10
			};
			options = $.extend(defaults, options);
//			console.log("top:" + options.top);
			if( $("#lean_overlay").length == 0) {
				var overlay = $('<div id="lean_overlay"></div>');
				$('body').append(overlay);
			}
			var keys = { tab:9, enter:13, esc:27, space:32, pageup:33, pagedown:34,
				end: 35, home: 36, left: 37, up: 38, right: 39, down: 40
			}
			var focusableSelectors = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabindex]:not([tabindex^="-"])'];



			function close_modal(modal_id){
				var returnFocus = $($(modal_id).attr("data-opener"));   //data-opener is a selector
                // hide the modal and overlay
				$('#lean_overlay').fadeOut(200);
				$(modal_id).css({'display': 'none'});
				// remove keybindings & opener items
				$(document).off('keydown.lnModalExt');
				$(modal_id).removeAttr('data-opener');
				returnFocus.trigger("focus");
			}

			//http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
			function isElementInViewport (el) {
					//special bonus for those using jQuery
					if (typeof jQuery === "function" && el instanceof jQuery) {
							el = el[0];
					}

					var rect = el.getBoundingClientRect();

					return (
							rect.top >= 0 &&
							rect.left >= 0 &&
							rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
							rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
					);
			}

			function reposition_modal(modal_id) {
				//move the modal into the viewport
				//if modal is taller than viewport-> put modal near top of viewport and ensure bottom does not extend passed the document bottom
				//if modal is taller than document-> enable scrolling of the modal and shrink the modal so there is an obvious border around it
				if($(modal_id).css('display') != "block") { return; }	//only reposition visible modals
				var modal_height = $(modal_id).outerHeight();
				var modal_width = $(modal_id).outerWidth();
				var viewport_height = $(window).height()
				var document_height = $(document).height();
				var viewport_top = $(window).scrollTop();
				var modalPadding = options.modalViewportPadding;
				var currentModalTop = parseInt($(modal_id).css('top').replace('px',''));

				//only move it if something doesn't fit
				var top = currentModalTop;

				if(isElementInViewport($(modal_id))) {
					//it's already visible, leave it alone --- still run .css below so we can catch margin-left changes on rotation
					//if they want it centered,
					if(options.top == "center")	{
						top = (viewport_top + ((viewport_height - modal_height) / 2));	// center the modal in the viewport
					}
				}
				else {
					if (modal_height < viewport_height) {
						top = (viewport_top + ((viewport_height - modal_height) / 2));	// center the modal in the viewport
					}
					else if(modal_height > document_height) {
						// shrink the modal and add scrollbars
						top = modalPadding;
						$(modal_id).css({"overflow-y": "scroll", "height": viewport_height - (modalPadding*2) });
					}
					else {
						//put the modal into the viewport
						top = viewport_top + modalPadding;
						if(top + modal_height > document_height) {
							//the modal extends passed the document bottom, move it up
							top = document_height - modal_height;
							var toScroll = top - modalPadding;
							$(window).scrollTop(toScroll >= 0 ? toScroll : 0);	//scroll to just above the top
						}
					}
				}
				$(modal_id).css({
					'left': 50 + '%',
					'margin-left': -(modal_width / 2) + 'px',
					'top': top + 'px'//o.top + 'px'
				});
			}

			function onModalKeydown(ev) {
				var flag = false;
				var $target = $(ev.target);
				var $modal = $target.closest(".modal");
				var $items = $(focusableSelectors.join(), $modal).filter(':visible');
				var k, item = -1;
				for (k = 0 ; k < $items.length ; k++) {
					if ($target.is($items[k])) { item = k; break; }
				}
				if (item < 0) return false;
				// move to previous link
				if ((ev.which == keys.tab)) {
					// move to previous link
					if (ev.shiftKey) {
						if (item > 0) {
							$items[item - 1].trigger("focus");
						} else {
							$items.last().trigger("focus");
						}
						flag = true;
					} else {
						if (item + 1 < $items.length) {
							$items[item + 1].trigger("focus");
						} else {
							$items[0].trigger("focus");
						}
						flag = true;
					}
				}
				// close menu and focus on menuBtn
				if (ev.which == keys.esc) {
					close_modal($modal);
					flag = true;
				}
				if (flag) {
					ev.stopPropagation();
					ev.preventDefault();
				}
			};

			return this.each(function(idx) {
				var o = options,
					$this = $(this); //$this is a reference to the link that triggered the modal, NOT the modal itself
				// auto assign ids to modal linked items
				if(this.id == '') { this.id = o.modalIdBase + idx ;}
				$this.on("click",function(e) {
					e.preventDefault();
					// Hides other modals, so they don't pile up if opening nested modals
					$('.modal').hide();
					// if this is a link, give it a role=button
					//if ( $this.attr('href') ) $this.attr('role', 'button');
                    if ($this.attr('href')) {
                        if ($this.attr('role') == "") { $this.attr('role', 'button'); }
                    }

					// find a reference to the modal id to display
					// Check aria-controls, rel, href, or class=ext in order for an ID to use
					var modal_id="placeholder",$modal_id;
					if ($this.attr('aria-controls') ) modal_id = '#' + $this.attr('aria-controls');
					if ($(modal_id).length == 0 && ($this.attr('rel'))) modal_id = $this.attr('rel');
					if(modal_id.indexOf("#") == -1) modal_id = $this.attr('href');
					if(modal_id.indexOf("#") == -1) {
						if($this.hasClass('ext')) modal_id = "#siteExit";
					}

					if ($(modal_id).length==0) {
						// Nothing returned a valid modal id, just follow the link
						return true;
					}
					// $modal_id is now a reference to the modal itself.
					$modal_id = $(modal_id);
					// store a reference to the opener in the data-opener attr of the modal --- make this a selector
					$modal_id.attr('data-opener',"#" + this.id);
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
					// define the focusable elements for this modal
					//	set first/last focusable elements

					var modal_height = $modal_id.outerHeight();
					var modal_width = $modal_id.outerWidth();
					var viewport_height = $(window).height()
					var viewport_top = $(window).scrollTop();
					$('#lean_overlay').css({'display': 'block', opacity: .5});
					$('#lean_overlay').fadeTo(200, o.overlay);

					var top = o.top;
					if (o.top == "center") {
						if (modal_height < viewport_height) {
							top = (viewport_top + ((viewport_height - modal_height) / 2));	//center in the viewport
						} else {
							top = viewport_top + defaults.modalViewportPadding;	//give it something, let reposition_modal fix it
						}
					}

					$modal_id.css({
						'display': 'block',
						'position': 'absolute',	//used to be fixed, but we want the modal to scroll when the page scrolls, fixed scrolled the page behind the modal
						'opacity': 0,
						'z-index': 11000,
						'left': 50 + '%',
						'margin-left': -(modal_width / 2) + 'px',
						'top': top + 'px'//o.top + 'px'
					});
					reposition_modal(modal_id,o);
					$(modal_id).fadeTo(200,1);

					// Set focus on modal open: updated 1/24/2019
					// If the _last_ focusable element is of type [submit|button|tag] with a value or text
					// of [ok|submit|continue] then focus on it, otherwise focus on the first the first focusable element 
					// - this must be done AFTER the modal is shown
					$modal_id.focusableElements = $(focusableSelectors.join(), $modal_id);
					var $last = $modal_id.focusableElements.last();
					var lastTag = $last.get(0).tagName.toLowerCase();
					var lastVal = "";
					if(lastTag =="submit" || lastTag == "button"){
						lastVal=$last.val().toLowerCase();
					} else if(lastTag =="a"){
						lastVal=$last.text().toLowerCase();
					}
					//allowed values
					if(lastVal == "ok" || lastVal == "submit" || lastVal == "continue"){
						$last.trigger("focus");
					} else {
						$modal_id.focusableElements.first().trigger("focus"); 
					}

					// handle tab trapping and esc to close
					$modal_id.on('keydown', onModalKeydown);
					$(window).on('resize', function(e) {
						reposition_modal(modal_id);
					})
					e.preventDefault();
				});
			});
      }
	});
})(jQuery);