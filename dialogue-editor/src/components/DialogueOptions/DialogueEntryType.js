import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionEntrySetType } from '../../actions/entryActions';
import * as constants from "../../constants";
import './DialogueOptions.css';

class DialogueEntryType extends Component {
  constructor(props) {
    super(props);

    this.createRadioButton = this.createRadioButton.bind(this);
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  createRadioButton(value, name) {
    return (
      // TODO CLICKABLE IN WHOLE ROW
      <div
        className="form-check"
        key={'entry_type_' + value}
      >
        <label>
          <input
            type="radio"
            name="react-tips"
            value={value}
            checked={this.props.type === value}
            className="form-check-input"
            onChange={this.handleRadioChange}
          />
          {name}
        </label>
      </div>
    );
  }

  handleRadioChange(event) {
    this.props.actionEntrySetType(event.target.value);
  }

  render() {
    const radiobuttons = [];

    Object.keys(constants.ENTRY_TYPE).forEach((key) => {
      radiobuttons.push(this.createRadioButton(key, constants.ENTRY_TYPE[key]));
    });

    return (
      <div className="EntryType">
        <label>
          Entry Type
          <form className="Padding">
            {radiobuttons}
          </form>
        </label>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  type: state.entryReducer.type,
});

const mapDispatchToProps = {
  actionEntrySetType,
};

export default connect(mapStateToProps, mapDispatchToProps)(DialogueEntryType);
