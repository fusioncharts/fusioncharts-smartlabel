var React = require('react');

class HTMLTextLiveDemo extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			text: 'a quick brown fox'		
		};
	}

	onChange (event) {
		this.setState({text: event.target.value});
	}

	render () {
		return (
				<div className='fc-sl-display-group'>
					<input 
						className='fc-sl-input' 
						defaultValue={this.state.text}
						onChange={this.onChange.bind(this)}
						></input>
					<br/>
					<div className='fc-sl-display-pane fc-demo-pane-text'>{this.state.text}</div>
				</div>
			);
	}
}

module.exports = HTMLTextLiveDemo;