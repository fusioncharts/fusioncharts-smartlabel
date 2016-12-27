var React = require('react'),
	DisplayPane = require('./display-pane'),
	SLDisplayPane = require('./smartlabel-display-pane');

class SVGTextLiveDemo extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			text: 'a quick brown fox',
			ellipsis: true,
			wrap: true
		};
	}

	onTextChange (event) {
		this.setState({text: event.target.value});
	}

	onSelectionChange (event) {
		if (event.target === this.ellipsisCtrl) {
			this.setState({ ellipsis: !this.state.ellipsis });
		} else if (event.target === this.wrapCtrl){
			this.setState({ wrap: !this.state.wrap });
		}
	}

	render () {
		var displayPane,
			extraControl;

		if (!this.props.smartLabelEnabled) {
			displayPane = <DisplayPane text={this.state.text} wrap={true} ellipsis={true} />;
		} else {
			displayPane = <SLDisplayPane text={this.state.text} wrap={this.state.wrap} ellipsis={this.state.ellipsis} />;
			extraControl = (
				<div className= 'demo-control'>
					<input 
						type="checkbox"  
						ref={elem => this.ellipsisCtrl = elem}
						checked={this.state.ellipsis}
						 onChange={this.onSelectionChange.bind(this)} />Ellipsis 
					<input 
						type="checkbox"  
						value="Car" 
						ref={elem => this.wrapCtrl = elem}
						checked={this.state.wrap}
						onChange={this.onSelectionChange.bind(this)} />Wrap
				</div>
				);
		}

		return (
				<div className='fc-sl-display-group'>
					<input 
						className='fc-sl-input' 
						defaultValue={this.state.text}
						onChange={this.onTextChange.bind(this)}
						></input>
					<br/>
					{displayPane}
					{extraControl}	
				</div>
			);
	}
}

module.exports = SVGTextLiveDemo;