/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';


class ContextMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuItems: [],
            selectedItems: [],
        };
    }

    close() {
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST'
        });
        this.setState({ menuItems: [], selectedItems: [] });
    }

    doAction(action) {
        fetch(`https://${GetParentResourceName()}/action`, {
            method: 'POST',
            body: JSON.stringify(action)
        });
    }

    render() {
        if (!this.state.menuItems.length) return null;
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
