// JavaScript Document

window.addEvent('domready', function() {
	  $$('img.mo').each(function(img) {
		var src = img.getProperty('src');
		var press_title = img.get('name');
		var main_img = $('main_press_image').getProperty('src');
		var extension = src.substring(src.lastIndexOf('.'),src.length)
		img.addEvent('mousedown', function() {  
		$('main_press_image').setProperty('src',src);
		src = $('main_press_image').getProperty('src');
		$('press_item_footer').set('html',press_title);
		});
	  });
});	

