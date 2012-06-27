/*
	Copyright (C) 2012 Copperflake Software <http://www.copperflake.com>
	
	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:
	
	The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function($) {
	// If not ready, queue and defer prettyScroll calls
	var ready = false;
	var queue = [];
	
	// Width of the native scoll bar
	var scrollNativeWidth;
	
	// Settings handling
	var defaults = {
		scrollX:        true,
		scrollY:        true,
		useFloat:       false,
		paddingLateral: 2,
		paddingBound:   2,
		borderWidth:    0,
		scrollWidth:    7,
		
		initTimer:      1000
	};
	
	$.prettyScroll = function(options) {
		var defaults = $.extend(defaults, options);
	}
	
	// Are global handlers set?
	var globalHandlersSet = false;
	
	// Pretty-scroll requires DOM readiness before doing anything
	$(function() {
		// Measure the native scroll width
		$("body").append("<div id=\"pretty-scroll-measure\" style=\"width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;\"></div>");
		var $measure = $("#pretty-scroll-measure");
		scrollNativeWidth = $measure[0].offsetWidth - $measure[0].clientWidth;
		$measure.remove();
		
		ready = true;
		
		// Flush the deferred-calls queue
		var call;
		while(call = queue.shift())
			$.fn.prettyScroll.call(call.target, call.options);
	});
	
	
	$.fn.prettyScroll = function(options) {
		// If not ready, defer
		if(!ready) {
			queue.push({target: this, options: options});
			return this;
		}
		
		var settings = $.extend(defaults, options);
		
		// Browser use pretty scrolls natively
		if(scrollNativeWidth <= 0) {
			this.each(function() {
				$(this).css({
					"overflow-x": settings.scrollX ? "auto" : "hidden",
					"overflow-y": settings.scrollX ? "auto" : "hidden"
				});
			});
			return this;
		}
		
		return this.each(function() {
			var $this = $(this);
			
			// Pretty-scoll is already assigned to this element
			// Trigger an update instead
			if($this.data("pretty-scroll"))
				return $this.children(".pretty-scroll-scroller").scroll();
			
			// Wrap content into pretty-scroll structure (this breaks some CSS!)
			$this.wrapInner("<div class=\"pretty-scroll-content\"></div>")
			     .wrapInner("<div class=\"pretty-scroll-scroller\"></div>")
			     .append("<div class=\"pretty-scroll-scroll pretty-scroll-scrollX\"></div>")
			     .append("<div class=\"pretty-scroll-scroll pretty-scroll-scrollY\"></div>")
			     .css({overflow: "hidden"})
			     .addClass("pretty-scroll");
			
			// Query pretty-scroll elements
			var $scroller = $this.children(".pretty-scroll-scroller");
			var $content  = $scroller.children(".pretty-scroll-content");
			var $scrollX  = $this.children(".pretty-scroll-scrollX");
			var $scrollY  = $this.children(".pretty-scroll-scrollY");
			
			// Applying base CSS
			$this.css({
				"position": "relative"  // For placing scrolls correctly
			});
			
			$scroller.css({
				"overflow": "scroll"    // Always display scroll bars
			});
			
			$content.css({
				"position": "relative"  // For user content placing
			});
			
			if(settings.useFloat)
				$content.css({ "float":    "left" });
			
			$scrollX.css({height: settings.scrollWidth, bottom: settings.paddingLateral, position: "absolute"});
			$scrollY.css({width:  settings.scrollWidth, right:  settings.paddingLateral, position: "absolute"});
			
			// Metrics
			var innerWidth,  outerWidth,  eOuterWidth,  scrollFactorX, scrollMaxX,
			    innerHeight, outerHeight, eOuterHeight, scrollFactorY, scrollMaxY;
			
			function updateScroll() {
				// X-axis metrics
				innerWidth = $content.innerWidth();
				outerWidth = $this.width();
				
				// Y-axis metrics
				innerHeight = $content.innerHeight();
				outerHeight = $this.height();
				
				// Adjust scroller size
				$scroller.width(outerWidth + scrollNativeWidth);
				$scroller.height(outerHeight + scrollNativeWidth);
				
				// Are scrolls displayed?
				var diplayX = settings.scrollX &&  innerWidth > outerWidth;
				var diplayY = settings.scrollY && innerHeight > outerHeight;
				
				// Scroll width + 2x padding
				var scrollbarWidth = settings.scrollWidth + settings.borderWidth * 2 + settings.paddingLateral * 2;
				
				// Effective outer width/height
				eOuterWidth  =  outerWidth - (settings.paddingBound * 2) - (diplayY ? scrollbarWidth : 0);
				eOuterHeight = outerHeight - (settings.paddingBound * 2) - (diplayX ? scrollbarWidth : 0);
				
				// Scroll factors (the 1px-scroll / 1px-content ratio)
				scrollFactorX =  eOuterWidth / innerWidth;
				scrollFactorY = eOuterHeight / innerHeight;
				scrollMaxX    =  innerWidth  - outerWidth;
				scrollMaxY    =  innerHeight - outerHeight;
				
				if(diplayX) {
					var width = eOuterWidth * scrollFactorX;
					var left  = ($scroller.scrollLeft() / scrollMaxX) * (eOuterWidth - width) + settings.paddingBound;
					
					$scrollX.css({
						display: "block",
						width:   width + "px",
						left:    left + "px"
					});
				} else {
					$scrollX.css({
						display: "none",
					});
				}
				
				if(diplayY) {
					var height = eOuterHeight * scrollFactorY;
					var top    = ($scroller.scrollTop() / scrollMaxY) * (eOuterHeight - height) + settings.paddingBound;
					
					$scrollY.css({
						display: "block",
						height:  height + "px",
						top:     top + "px"
					});
				} else {
					$scrollY.css({
						display: "none",
					});
				}
			};
			
			// Init scroll
			updateScroll();
			
			// Init visibility
			if(settings.initTimer) {
				$scrollX.addClass("init");
				$scrollY.addClass("init");
				
				setTimeout(function() {
					$scrollX.removeClass("init");
					$scrollY.removeClass("init");
				}, settings.initTimer);
			}
			
			// Bind events
			$scroller.scroll(updateScroll);
			$this.mouseover(updateScroll);
			
			if(!globalHandlersSet) {
				$(window).resize(function() {
					$(".pretty-scroll").prettyScroll();
				});
				globalHandlersSet = true;
			}
			
			// Dragging
			var dragging        = false;
			var dragging_x_axis = false;
			var dragging_startL = 0;
			var dragging_startX = 0;
			var dragging_startT = 0;
			var dragging_startY = 0;
			
			var fn_up, fn_move;
			
			function dragging_up(e) {
				dragging = false;
				(dragging_x_axis ? $scrollX : $scrollY).removeClass("active");
				e.preventDefault();
			}
			
			function dragging_move(e) {
				if(dragging) {
					var method = dragging_x_axis ? "scrollLeft" : "scrollTop";
					var value  = dragging_x_axis
					           ? dragging_startL + ((e.clientX - dragging_startX) / scrollFactorX)
					           : dragging_startT + ((e.clientY - dragging_startY) / scrollFactorY);
					
					$scroller[method](value);
					e.preventDefault();
				} else {
					$(document).unbind("mouseup",   dragging_up);
					$(document).unbind("mousemove", dragging_move);
				}
			}
			
			function dragging_down(x_axis) {
				return function(e) {
					if(dragging)
						return;
					
					dragging = true;
					dragging_x_axis = x_axis;
					
					console.log("down")
					
					if(x_axis) {
						dragging_startL = $scroller.scrollLeft();
						dragging_startX = e.clientX;
					} else {
						dragging_startT = $scroller.scrollTop();
						dragging_startY = e.clientY;
					}
					
					(x_axis ? $scrollX : $scrollY).addClass("active");
					
					$(document).bind("mouseup",   dragging_up);
					$(document).bind("mousemove", dragging_move);
					
					e.preventDefault();
				}
			}
			
			// Bind
			$scrollX.mousedown(dragging_down(true));
			$scrollY.mousedown(dragging_down(false));
			
			// Record pretty-scroll state for this element
			$this.data("pretty-scroll", true);
		});
	};
})(jQuery);
