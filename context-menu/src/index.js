/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

function elementFocus(focus) {
    fetch(`https://${GetParentResourceName()}/elementFocus`, {
        method: 'POST',
        body: JSON.stringify({ focus })
    });
}

class Input extends React.Component {
    _handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.props.onEnter(e.target.value);
            if (this.props.clearOnEnter) {
                e.target.value = "";
            }
        }
    }

    render() {
        return <input {...this.props} onKeyDown={this._handleKeyDown} onFocus={() => elementFocus(true)} onBlur={() => elementFocus(false)} />
    }
}

class ContextMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuItems: [],
            selectedItems: [],
            textInput: "",
        };
        this.textInputAction = [];
    }

    close() {
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST'
        });
        this.setState({ menuItems: [], selectedItems: [], textInput: "" });
    }

    doAction(action) {
        fetch(`https://${GetParentResourceName()}/action`, {
            method: 'POST',
            body: JSON.stringify(action)
        });
    }

    render() {
        if (!this.state.menuItems.length) return null;

        if (this.state.textInput) {
            let onEnter = (input) => {
                this.textInputAction.push(input);
                this.doAction(this.textInputAction);
                this.textInputAction = [];
                this.close();
            };
            return (
                <div className="textInput">
                    <p>{this.state.textInput}:</p>
                    <Input type="text" onEnter={onEnter} />
                </div>
            )
        }

        let menuItems = this.state.menuItems;
        for (let i = 0; i < this.state.selectedItems.length; i++) {
            menuItems = menuItems[this.state.selectedItems[i]].children;
        }

        let items = [];
        if (this.state.selectedItems.length) {
            let goBack = () => {
                this.state.selectedItems.pop();
                this.setState({ selectedItems: this.state.selectedItems });
            };
            items.push(
                <div onClick={goBack}>
                    Go Back
                </div>
            )
        }
        for (let i = 0; i < menuItems.length; i++) {
            let item = menuItems[i];
            let onClick = () => {
                if (item.textInput) {
                    this.textInputAction = item.action;
                    this.setState({
                        textInput: item.textInput
                    });
                    return;
                }
                if (item.action) {
                    this.doAction(item.action);
                    if (!this.children) this.close();
                }
                if (item.children) {
                    this.state.selectedItems.push(i);
                    this.setState({ selectedItems: this.state.selectedItems });
                }
            }
            items.push(
                <div onClick={onClick}>
                    <p><b>{item.title}</b></p>
                    {item.description && <p>{item.description}</p>}
                </div>
            )
        }
        return (
            <div className="contextMenu">
                {items}
            </div>
        );
    }
}


const contextMenu = ReactDOM.render(
    <ContextMenu />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'open-menu') {
        contextMenu.setState({
            menuItems: data.menuItems,
        });
    }
});
