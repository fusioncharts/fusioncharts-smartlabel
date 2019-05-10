/* global chai, describe, it, before */
'use strict';

var	expect = chai.expect;

describe('SmartLabel', function () {
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
				if (!(method in SmartLabel.prototype)) {
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
		sl = new SmartLabel(Math.random());
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

			expect(size.height).to.be.equal(24);
			// Error value: +-2px
			expect(size.width).to.be.within(178, 182);
		});


	it('truncates the text correctly',
		function () {
			var smartlabel = sl.getSmartText('a quick brown fox over the lazy dog', 80, 50);

			expect(smartlabel.text).to.equal('a quick<br />brown f');
		});


	it('truncates the text correctly without wrapping',
		function () {
			var smartlabel = sl.getSmartText('a quick brown fox over the lazy dog', 80, 50, true);

			expect(smartlabel.text).to.equal('a quick');
		});


	it('truncates the text correctly without wrapping with ellipses',
		function () {
			var text = 'a quick brown fox over the lazy dog',
				smartlabel = sl
				.useEllipsesOnOverflow(true)
				.getSmartText('a quick brown fox over the lazy dog', 80, 50, true);

			expect(smartlabel.text.length).to.be.within(8, 9);
			expect(smartlabel.text.substr(smartlabel.text.length - 3)).to.be.equal('...');
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
					.getSmartText('<span>a quick brown fox over the lazy dog</span>', 80, 100),
					possibleVals = [
						'<span>a quick<br>brown<br>fox<br>over t</span>...',
						'<span>a quick<br>brown<br>fox<br>over </span>...'
					];

			// Based on pixel returned by the browsers the text might vary a bit. Assertion happens
			// from a list of available values.
			expect(possibleVals).to.include(smarttext.text);
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
			var smarttext = SmartLabel.textToLines(sl
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
