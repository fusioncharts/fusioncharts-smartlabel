var DisplayPane = require('./display-pane'),
	SmartLabelManager = require('fusioncharts-smartlabel');

class SLDisplayPane extends DisplayPane {
	constructor(props) {
		super(props);
	}

	componentWillMount () {
		this.smartlabel = new SmartLabelManager(Math.random());
	}

	textJoin (textContent, ellipsis, wrap) {
		var text = this.svg.select('text'),
			tspan,
			smarttext,
			oriSize;

		if (text.size() === 0) {
			text = this.svg.append('text').text(null); 
		}

		text
			.attr('dy', ".35em")
			.attr('class', 'fc-demo-pane-text');

		this.smartlabel.useEllipsesOnOverflow(ellipsis);
		smarttext = SmartLabelManager.textToLines(this.smartlabel.getSmartText(textContent, this.width, this.height, !wrap));
		oriSize = this.smartlabel.getOriSize(textContent);
		
		tspan = text
			.selectAll('tspan')
			.data(smarttext.lines);

		tspan
			.enter()
				.append('tspan')
			.merge(tspan)
				.attr("dy", oriSize.height)
				.attr("x", 0)
				.text(d => d);

		tspan
			.exit()
			.remove();
	}
}

module.exports = SLDisplayPane;