import React, { Component } from 'react';
import './DialogueView.css';

class DialogueEditor extends Component {
  constructor(props) {
    super(props);
    
    const linestring = 'abcdefghijklmnopqrstuvwxyzabcdefghijk';
    let lines = '';
    for (let i = 0; i < 7; i++) {
      lines += linestring;
    }

    this.state = {
      value: lines,
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('SUBMIT');
    event.preventDefault();
  }

  render() {
    return (
      <div className="DialogueEditor">
        <div className="Status">
          <label className="Page">{'Page ' + this.props.number}</label>
          <label className="Page">{'Chars: ' + this.state.value.length}</label>
        </div>
        <div className="View">
          <form className="ViewForm" onSubmit={this.handleSubmit}>
            <textarea
              className="ViewTextArea"
              maxLength={37*7}
              value={this.state.value}
              onChange={this.handleChange}
            />
          </form>
        </div>
        <div className="Controls">
          <button>{'<+'}</button>
          <button>{'X'}</button>
          <button>{'+>'}</button>
        </div>
      </div>
    );
  }
}

export default DialogueEditor;
