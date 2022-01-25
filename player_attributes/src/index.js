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
        this.state = {
            visible: true,
            attributes: {
                health: -1,
                clipSize: -1,
                totalAmmo: -1
            }
        }
    }


    render() {
        if (!this.state.visible) return null;
        return (
            <div>
                <div id="ammo">
                    {this.state.attributes.clipSize !== -1 ? <p>{this.state.attributes.clipSize}/{this.state.attributes.totalAmmo}</p> : ""}
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
            attributes: {
                health: data.attributes.health,
                clipSize: data.attributes.clipSize,
                totalAmmo: data.attributes.totalAmmo
            }
        })
    }
});
