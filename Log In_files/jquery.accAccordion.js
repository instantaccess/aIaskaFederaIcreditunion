/*
accAccordion v 1.0

Accessible, semantic jquery accordion by Jared Noble
Inspired by Lightweight, semantic jquery accordion Sam Croft

Features
- Semantic DL - Each DT > A contains a header, while the subsequent DD is the collapsible panel
- Visibility / Sizing of panels controlled via classes, not by dynamically changing css properties
- Accessible - Conformant with Aria Accordion pattern, including keyboard navigation
- Header activation bound to click, touch, and keyboard (enter,space)
- 'default' class on DT will prevent its panel from being closed at render
- open/close via 'active' class on the dt
- Automatic activation of dt with id matching window url.hash value

Updates:
- adding role=presentation to the containing dl causes tools like AXE to not recognize the dl and complain about structure.
  this is a case of the tools being stupid.
- 6/28/21 JN - do not add role=region to .accAcc dd

*/

(function($){
	$.fn.accAccordion = function(options) {
		// Extend our default options with those provided.
		var opt = $.extend( {}, $.fn.accAccordion.defaults, options );
		// normalize inputs to allowed values
		opt.allowAllClosed = (opt.allowAllClosed == true || opt.allowAllClosed=='true') ? true : false;
		opt.allowMultipleOpen = (opt.allowMultipleOpen == true || opt.allowMultipleOpen == 'true') ? true : false;

		var $el = this,
			keys = { tab:9, enter:13, esc:27, space:32, pageup:33, pagedown:34,
			end:35, home:36, left:37, up:38, right:39, down:40 };

		$el.each(function(accIndex) {
			// Auto assign id to accordian if one does not exist
			if(this.id == '') this.id='acc_' + accIndex;
			accInit($(this));
		});

		function accInit($acc) {
			var $headers = $acc.children('dt');
            var $panels  = $acc.children('dd');
            // adapt to broken scan tools by removing role=presentation
			// $acc.addClass(opt.accClass).addClass('enhance').attr('role','presentation');
			$acc.addClass(opt.accClass).addClass('enhance');
			// Add ids and Aria attributes to headers and panels, then close them all
			$headers.each( function(index){
				// Auto assign id to acc header if one does not exist
				if(this.id == "") this.id=$acc.attr("id") + "_" + index;
				var $header = $(this);
				$header.addClass(opt.headerClass)
					.children('a').attr('role','button').attr('aria-controls',this.id + '_panel');
				var $panel = $header.next('dd');
				$panel.attr('id',this.id + '_panel').addClass(opt.panelClass)
					.attr('aria-labelledby',this.id);
				accClose($header);
			});
			// set the active acc element - if one matches page hash
			var hash = location.hash.slice(1);
			if ($acc.find("." + opt.headerClass + '[id="'+hash+'"]').length) {
				accOpen($acc.find("." + opt.headerClass + '[id="'+hash+'"]'));
			} else {
				// otherwise if not allowAllClosed then open the first header
				if (!opt.allowAllClosed) accOpen($headers.first());
			}
			applyHandlers($acc);
		};
		function accClose($header) {
			$header.removeClass('active').children('a').attr('aria-expanded','false').removeAttr('aria-disabled');
			var $panel = $header.next("." + opt.panelClass);
			$panel.addClass('closed').attr('aria-hidden','true').hide()
		};
		function accOpen($header){
			$header.addClass('active').children('a').attr('aria-expanded','true');
			if (!opt.allowAllClosed) $header.children('a').attr('aria-disabled','true');
			var $panel = $header.next("." + opt.panelClass);
			$panel.removeClass('closed').attr('aria-hidden','false').show()
		};
		function applyHandlers($acc) {
			$acc.on('touchstart, click','.' + opt.headerClass + ' > a', onActivate);
			$acc.on('keydown','.' + opt.headerClass, onHeaderKeydown);
			$acc.on('keydown','.' + opt.panelClass, onPanelKeydown);
		};
		function onActivate(ev) {
			// click and touchstart behavior on accordion headers
			ev.preventDefault();
			var $current = $(this).parent(),
				$active;
			if($current.hasClass('active')) {
				if(opt.allowAllClosed) {
					accClose($current);
					if(window.history){
						window.history.replaceState(history.state,'','');
					} else {
						location.hash = '';
					}
				}
			} else {
				if(!opt.allowMultipleOpen){
					$active = $el.find('.' + opt.headerClass + '.active');
					if ($active.length) accClose($active);
				}
				accOpen($current);
				if(window.history){
					window.history.replaceState(history.state,'','#' + $current.attr('id'));
				} else {
					location.hash = $current.attr('id');
				}
			}
		};
		function onHeaderKeydown(ev) {
			// ctrl-pageup and ctrl-pagedown dont work on Firefox (browser intercepts them)
			// also don't work on Chrome, but not sure why
			var cancelEvent=false,
				$target=$(ev.target),
				$header = $target.closest('.' + opt.headerClass);
			// on space or enter, open panel (or close it if open and allowAllClosed)
			if (ev.which == keys.space || ev.which == keys.enter) {
				if($header.hasClass('active')){
					if($header.parent().children('.' + opt.headerClass + '.active').length ==1){
						if(opt.allowAllClosed) accClose($header);
					} else {
						accClose($header);
					}
				} else {
					if(!opt.allowMultipleOpen){
						var $active = $header.parent().find('.' + opt.headerClass + '.active');
						if($active.length) accClose($active);
					}
					accOpen($header);
				}
				cancelEvent=true;
			}
			// move focus to previous header (no wraparound)
			if (ev.which == keys.up || ev.which == keys.left || (ev.which == keys.pageup && ev.ctrlKey)){
				$header.prevAll('.' + opt.headerClass).first().find('a').trigger("focus");
				cancelEvent=true;
			}
			// move focus to next header (no wraparound)
			if (ev.which == keys.down || ev.which == keys.right || (ev.which == keys.pagedown && ev.ctrlKey)){
				$header.nextAll('.' + opt.headerClass).first().find('a').trigger("focus");
				cancelEvent=true;
			}
			// move focus to first tab
			if (ev.which == keys.home){
				$header.prevAll('.' + opt.headerClass).last().find('a').trigger("focus");
				cancelEvent=true;
			}
			// move focus to last tab
			if (ev.which == keys.end){
				$header.nextAll('.' + opt.headerClass).last().find('a').trigger("focus");
				cancelEvent=true;
			}
			if(cancelEvent){
				ev.stopPropagation();
				ev.preventDefault();
			}
		};
		function onPanelKeydown(ev) {
			var cancelEvent=false,
				$target=$(ev.target),
				$panel = $target.closest("." + opt.panelClass),
				$header = $panel.prev("." + opt.headerClass);//,
			// ctrl-pageup and ctrl-pagedown dont work on Firefox (browser intercepts them)
			// also don't work on Chrome, but not sure why

			// move focus to previous header (no wraparound)
			if (ev.which == keys.pageup && ev.ctrlKey){
				if($header.prevAll("." + opt.headerClass).length){
					$header.prevAll("." + opt.headerClass).first().find('a').trigger("focus");
				} else {
					$header.children('a').trigger("focus");
				}
				cancelEvent=true;
			}
			// move focus to next header (no wraparound)
			if (ev.which == keys.pagedown && ev.ctrlKey){
				if($header.nextAll("." + opt.headerClass).length){
					$header.nextAll("." + opt.headerClass).first().find('a').trigger("focus");
				} else {
					$header.children('a').trigger("focus");
				}
				cancelEvent=true;
			}
			if (cancelEvent) {
				ev.stopPropagation();
				ev.preventDefault();
			}
		};

	}
	// Plugin defaults - always and only one open panel
	$.fn.accAccordion.defaults = {
		allowAllClosed : false,
		allowMultipleOpen : false,
		accClass : "accAcc",
		headerClass : "accAccHeader",
		panelClass : "accAccPanel"
	};
})(jQuery);