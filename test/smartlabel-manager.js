/* global chai, describe, it, before */

'use strict';

var	expect = chai.expect,
	SmartLabelManager = require('fusioncharts-smartlabel');

describe('SmartLabelManager', function () {
	var sl;

	it('retains the public API',
		function () {
			var i,
				l,
				method,
				apiList = [
					'setStyle',
					'useEllipsesOnOverflow',
					'getSmartText',
					'getOriSize',
					'dispose'
				],
				dirty = false;

			for (i = 0, l = apiList.length; i < l; i++) {
				method = apiList[i];
				if (!(method in SmartLabelManager.prototype)) {
					dirty = true;
					break;
				}

			}

			if (dirty) {
				expect(true).to.be.false;
			} else {
				expect(true).to.be.true;
			}
		});


	before(function () {
		sl = new SmartLabelManager(Math.random());
	});


	it('creates a div in body with classname fusioncharts-smartlabel',
		function () {
			var elem = document.body.getElementsByClassName('fusioncharts-smartlabel-container');
			expect(elem.length).to.equal(1);
		});


	it('creates container outside the view port',
		function () {
			var prop,
				elem = document.body.getElementsByClassName('fusioncharts-smartlabel-container')[0],
				style = getComputedStyle(elem),
				hiddenStyle = {
					position: 'absolute',
					width: '1px',
					height: '1px',
					overflow: 'hidden',
					whiteSpace: 'nowrap'
				},
				top = -9999,
				dirty = false;

			for (prop in hiddenStyle) {
				if(hiddenStyle[prop] !== style[prop]) {
					dirty = true;
					break;
				}
			}

			if (!dirty && (+style.top.match(/\d+/)[0] < top)) {
				dirty = true;
			}

			if (dirty) {
				expect(true).to.be.false;
			} else {
				expect(true).to.be.true;
			}
		});


	it('sets the style properly',
		function () {
			var sizeWOStyle = sl.getOriSize('A quick brown fox'),
				sizeWithStyle = sl
					.setStyle({fontSize: '30px'})
					.getOriSize('A quick brown fox');


			expect(sizeWOStyle).to.not.deep.equal(sizeWithStyle);
		});


	it('calculates the text size correctly when style is set',
		function () {
			var size = sl
					.setStyle({
						fontSize: '20px',
						fontFamily: 'Verdana'
					})
					.getOriSize('a quick brown fox');

			expect(size).to.deep.equal({ height: 24, width: 179});
		});


	it('truncates the text correctly',
		function () {
			var smartlabel = sl.getSmartText('a quick brown fox over the lazy dog', 80, 50);

			expect(smartlabel.text).to.equal('a quick<br/>brown f');
		});


	it('truncates the text correctly without wrapping',
		function () {
			var smartlabel = sl.getSmartText('a quick brown fox over the lazy dog', 80, 50, true);

			expect(smartlabel.text).to.equal('a quick');
		});


	it('truncates the text correctly without wrapping with ellipses',
		function () {
			var smartlabel = sl
				.useEllipsesOnOverflow(true)
				.getSmartText('a quick brown fox over the lazy dog', 80, 50, true);

			expect(smartlabel.text).to.equal('a qui...');
		});


	it('truncates the text to empty string when height is too small ',
		function () {
			var smarttext = sl
					.getSmartText('a quick brown fox over the lazy dog', 100, 8);

			expect(smarttext.text).to.equal('');
		});


	it('truncates the text when html tag is present',
		function () {
			var smarttext = sl
					.useEllipsesOnOverflow(false)
					.getSmartText('<p>a quick brown fox over the lazy dog</p>', 100, 100);

			expect(smarttext.text).to.equal('<p>a quick<br>brown<br>fox over t</p>');
		});


	it('truncates the text with ellipses when html tag is present',
		function () {
			var smarttext = sl
					.useEllipsesOnOverflow(true)
					.getSmartText('<span>a quick brown fox over the lazy dog</span>', 80, 100);

			expect(smarttext.text).to.equal('<span>a quick<br>brown<br>fox<br>over </span>...');
		});


	it('truncates the text to null when html tag is present and width is too small',
		function () {
			var smarttext = sl
					.useEllipsesOnOverflow(true)
					.getSmartText('<span>a quick brown fox over the lazy dog</span>', 4, 100);

			expect(smarttext.text).to.equal('');
		});


	it('truncates the ellipses as well when the space is not much',
		function () {
			var smarttext = sl
					.setStyle({
						fontSize: '12px',
						fontFamily: 'Verdana'
					})
					.getSmartText('<p>AQuickBrownFoxOverTheLazyDog</span>', 17, 100);

			expect(smarttext.text).to.equal('<p>A<br>Q<br>ui<br>ck<br>Br<br>o</p>.');
		});


	it('truncates the ellipses as well when the space is not much not text is not wrapped',
		function () {
			var smarttext = sl
					.getSmartText('<p>AQuickBrownFoxOverTheLazyDog</span>', 17, 100, true);

			expect(smarttext.text).to.equal('<p>A</p>.');
		});


	it('does not truncate the text when the space is big enough',
		function () {
			var smarttext = sl
					.getSmartText('AQuickBrownFoxOverTheLazyDog', 1400, 1000);

			expect(smarttext.text).to.equal('AQuickBrownFoxOverTheLazyDog');
		});


	it('transforms the smarttext in array when wrapped',
		function () {
			var smarttext = SmartLabelManager.textToLines(sl
					.getSmartText('AQuickBrownFoxOverTheLazyDog', 40, 1000));

			expect(smarttext.lines.length).to.equal(6);
		});


	it('removes the div when disposed',
		function () {
			sl.dispose();

			var elem = document.body.getElementsByClassName('fusioncharts-smartlabel-container');
			expect(elem.length).to.equal(0);
		});

});
