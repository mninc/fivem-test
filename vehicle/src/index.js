/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';


class VehicleMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false
        };
    }

    close() {
        fetch(`https://${GetParentResourceName()}/closeVehicleMenu`, {
            method: 'POST'
        });
        this.setState({ visible: false });
    }

    setSeat(seat) {
        fetch(`https://${GetParentResourceName()}/setSeat`, {
            method: 'POST',
            body: JSON.stringify({ seat })
        });
        this.close();
    }

    toggleEngine() {
        fetch(`https://${GetParentResourceName()}/toggleEngine`, {
            method: 'POST'
        });
        this.close();
    }

    render() {
        if (!this.state.visible) return null;
        return (
            <div className="vehicleMenu">
                <button onClick={() => this.toggleEngine()}>Toggle Engine</button>
                <button onClick={() => this.setSeat(-1)}>Seat -1</button>
                <button onClick={() => this.setSeat(0)}>Seat 0</button>
                <button onClick={() => this.setSeat(1)}>Seat 1</button>
                <button onClick={() => this.setSeat(2)}>Seat 2</button>
            </div>
        );
    }
}


const vehicleMenu = ReactDOM.render(
    <VehicleMenu />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'vehicle_menu') {
        vehicleMenu.setState({
            visible: data.display
        });
    }
});
