var DivTextDemo,
	SvgTextDemo,
	SvgSmartLabelDemo,
	React = require('react'),
	ReactDOM = require('react-dom'),
	HTMLTextLiveDemo = require('./components/html-text-live-demo'),
	SVGTextLiveDemo = require('./components/svg-text-live-demo');


DivTextDemo = React.createClass({
	render () {
		return (
			<HTMLTextLiveDemo />
		);
	}
});

SvgTextDemo = React.createClass({
	render () {
		return (
			<SVGTextLiveDemo />
		);
	}
});

SvgSmartLabelDemo = React.createClass({
	render () {
		return (
			<SVGTextLiveDemo smartLabelEnabled={true} />
		);
	}
});

ReactDOM.render(<DivTextDemo />, document.getElementById('html-auto-text-ops-demo-1'));
ReactDOM.render(<SvgTextDemo />, document.getElementById('svg-def-text-ops-demo-1'));
ReactDOM.render(<SvgSmartLabelDemo />, document.getElementById('svg-sl-def-text-ops-demo-1'));