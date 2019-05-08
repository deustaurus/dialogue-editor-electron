import React, { Component } from 'react';
import './StatusBar.css';
import '../DialogueTree/DialogueTree.css';
import '../DialogueView/DialogueView.css';
import '../DialogueOptions/DialogueOptions.css';

class StatusBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      regionValue: 'en',
    };
  }

  render() {
    return (
      <div className="StatusBar">
        <div className="TreeContainer">
          <form>
            <label>
              Region:
              <select value={this.state.regionValue}>
                <option value='en'>{'en'}</option>
                <option disabled>_________</option>
                <option value='new'>{'New Region'}</option>
              </select>
            </label>
          </form>
        </div>
        <div className="ViewContainer">
          No Entry Selected
        </div>
        <div className="OptionsContainer">
        </div>
      </div>
    );
  }
}

export default StatusBar;