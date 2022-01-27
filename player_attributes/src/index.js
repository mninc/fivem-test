import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class StatWheel extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div style={{ backgroundColor: this.props.color }}>{this.props.percentage}%</div>
    }
}

class PlayerAttributes extends React.Component {
    constructor(props) {
        super(props);
        this.cashTimeoutHandle;
        this.state = {
            visible: true,
            attributes: {
                health: -1,
                clipSize: -1,
                totalAmmo: -1,
                cash: -1,
            },
            showCash: false
        }
    }

    showCash(change) {
        this.setState({
            showCash: true,
            cashChange: change
        });
        clearTimeout(this.cashTimeoutHandle);
        this.cashTimeoutHandle = setTimeout(() => {
            this.cashTimeoutHandle = null;
            this.setState({
                showCash: false,
                cashChange: 0
            });
        }, 2000);
    }


    render() {
        if (!this.state.visible) return null;
        return (
            <div>
                <div id="ammo">
                    {this.state.attributes.clipSize !== -1 ? <p>{this.state.attributes.clipSize}/{this.state.attributes.totalAmmo}</p> : ""}
                </div>
                <div id="cash">
                    {this.state.showCash ? <p>${this.state.attributes.cash}</p> :  ""}
                    {this.state.showCash && this.state.cashChange ? <p className={"cash-change" + (this.state.cashChange < 0 ? " cash-change-negative" : "")}>{this.state.cashChange < 0 ? "-" : "+"}${Math.abs(this.state.cashChange)}</p> : ""}
                </div>
                <div id="wheels">
                    <StatWheel percentage={this.state.attributes.health} color="green" />
                </div>
            </div>
        )
    }
}

const attributes = ReactDOM.render(
    <PlayerAttributes />,
    document.getElementById('root')
);

console.log("listener set up");
window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'visible') {
        attributes.setState({
            visible: data.visible,
            attributes: data.attributes
        })
    } else if (data.action === "show_cash") {
        attributes.showCash(data.change);
    }
});
