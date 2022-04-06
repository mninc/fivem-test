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
            } else if (option === "inventory:shop-bank-robbery") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-piggy-bank"></i>
                        Get Bank Supplies
                    </p>
                )
            } else if (option === "tasks:start-boost") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-car"></i>
                        Start Boost
                    </p>
                )
            } else if (option === "tasks:collect-cash") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-money-bill-wave"></i>
                        Collect Cash
                    </p>
                )
            } else if (option === "inventory:shop-24-7") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-shopping-basket"></i>
                        Open Shop
                    </p>
                )
            } else if (option === "inventory:shop-ammunation") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-bomb"></i>
                        Purchase Weapons
                    </p>
                )
            } else if (option === "vehicle:rental-menu") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-car"></i>
                        Rent Vehicle
                    </p>
                )
            } else if (option === "vehicle:sale-menu") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-car"></i>
                        Buy Vehicle
                    </p>
                )
            } else if (option === "police:sign-in-menu") {
                buttons.push(
                    <p id={option} onClick={() => this.selectOption(option)}>
                        <i class="fas fa-business-time"></i>
                        Sign on duty
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
