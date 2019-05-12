import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actionTreeModify, actionTreeSetActive } from './actions/treeAction'
import { actionEntrySetRegion, actionEntrySetRegionList } from './actions/entryActions';
import './App.css';
import StatusBar from './components/StatusBar/StatusBar';
import DialogueTree from './components/DialogueTree/DialogueTree';
import DialoguePages from './components/DialoguePages/DialoguePages';
import DialogueOptions from './components/DialogueOptions/DialogueOptions';
const { ipcRenderer } = window.require('electron');

class App extends Component {
  constructor(props) {
    super(props);

    this.treeData = null;
  }
  
  componentDidMount() {
    ipcRenderer.on('tree_change', this.onTreeDataChanged);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('tree_change', this.onTreeDataChanged);
  }

  onTreeDataChanged = (event, data) => {
    const tree = { 
      module: 'Content',
      children: [],
      isEntry: false,
      collapsed:  false,
    };
    this.buildTreeRecursive(data.msg.data.group, tree, false);

    const regions = [];
    const loadedRegions = data.msg.data.info.regions.region;
    if (Array.isArray(loadedRegions)) {
      loadedRegions.forEach((parsedRegion) => {
        regions.push(parsedRegion._text);
      });
    } else {
      regions.push(loadedRegions._text);
    }

    this.props.actionTreeModify(tree);
    this.props.actionTreeSetActive(null);
    this.props.actionEntrySetRegionList(regions);
    this.props.actionEntrySetRegion(data.msg.data.info.activeregion._text);

    this.treeData = data; // No need to trigger state change when this is modified
  }

  buildTreeRecursive(treeNode, parent, createNode = true) {
    let newParent = parent;
    if (createNode) {
      newParent = {
        module: treeNode._attributes.id,
        children: [],
        entry: undefined,
        collapsed: true,
      }
      parent.children.push(newParent);
    }

    // Step through and create groups
    if (treeNode.group !== undefined) {
      if (Array.isArray(treeNode.group)) {
        treeNode.group.forEach( (group) => {
          this.buildTreeRecursive(group, newParent);
        });
      } else {
        this.buildTreeRecursive(treeNode.group, newParent);
      }
    }

    // Create entries
    if (treeNode.entry !== undefined) {
      if (Array.isArray(treeNode.entry)) {
        treeNode.entry.forEach( (entry) => {
          this.addEntry(entry, newParent);
        });
      } else {
        this.addEntry(treeNode.entry, newParent);
      }
    }
  }

  addEntry(entry, parent) {
    const newEntry = {
      module: entry._attributes.id,
      entry: entry,
      leaf: true,
    }
    parent.children.push(newEntry);
  }

  render() {
    return (
      <div className="App">
        <header className="Header"/>
        <StatusBar />
        <div className="DialogueContainer">
          <DialogueTree />
          <DialoguePages />
          <DialogueOptions />
        </div>
      </div>
    ); 
  }
}

const mapDispatchToProps = {
  actionTreeModify,
  actionTreeSetActive,
  actionEntrySetRegion,
  actionEntrySetRegionList,
};

export default connect(null, mapDispatchToProps)(App);
