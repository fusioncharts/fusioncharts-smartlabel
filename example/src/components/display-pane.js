var d3 = require('d3'),
	React = require('react'),
	ReactDOM = require('react-dom');

class DisplayPane extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount () {
		var svg = this.svg = d3.select(ReactDOM.findDOMNode(this)),
			style = getComputedStyle(svg.node());
			
		this.height = +style.height.match(/\d+/)[0],
		this.width = +style.width.match(/\d+/)[0];

		this.textJoin(this.props.text, this.props.ellipsis, this.props.wrap);
	}

	componentWillUpdate (nextProps) {
		this.textJoin(nextProps.text, nextProps.ellipsis, nextProps.wrap);
	}

	textJoin (textContent) {
		var text = this.svg.selectAll('text').data([textContent]);

		text
			.enter()
				.append('text')
				.attr("dy", ".35em")
				.attr("y", 12)
				.attr('class', 'fc-demo-pane-text')
			.merge(text)
				.text(d => d);

		text
			.exit()
			.remove();
			
	}

	render () {
		return (
				<svg className='fc-sl-display-pane' xmlns="http://www.w3.org/2000/svg">
				</svg>
			);
	}
}

module.exports = DisplayPane;