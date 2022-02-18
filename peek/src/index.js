/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Peek extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            options: []
        };
    }

    selectOption(option) {
        this.setState({
            visible: false,
            options: []
        });
        fetch(`https://${GetParentResourceName()}/selectedOption`, {
            method: 'POST',
            body: JSON.stringify({ option })
        });
    }

    render() {
        if (!this.state.visible) return null;

        const buttons = [];
        for (let i = 0; i < this.state.options.length; i++) {
            let option = this.state.options[i];
            if (option === "atm") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-money-bill-wave"></i>
                        Use ATM
                    </p>
                )
            } else if (option === "bank-robbery:ped") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-piggy-bank"></i>
                        Get Bank Supplies
                    </p>
                )
            }

        }
        return (
            <div className="peek">
                {buttons}
            </div>
        )
    }
}

const peek = ReactDOM.render(
    <Peek />,
    document.getElementById('root')
);

console.log("listener set up");
window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'peek' || data.action === "close_peek") {
        peek.setState({
            visible: data.action === 'peek',
            options: data.action === 'peek' ? data.options : []
        });
    }
});
