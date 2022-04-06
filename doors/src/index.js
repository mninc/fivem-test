/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';


class LockIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nearbyDoor: false,
            doorLocked: false,
            haveKeys: false,
        };
    }

    render() {
        if (!this.state.nearbyDoor) return null;
        return (
            <div className='door-lock' style={{ backgroundColor: this.state.doorLocked ? "red" : "green" }}>
                {this.state.haveKeys && "[E] "}
                {this.state.doorLocked ? "Locked" : "Unlocked"}
            </div>
        );
    }
}


const lockIcon = ReactDOM.render(
    <LockIcon />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'door') {
        lockIcon.setState(data.state);
    }
});
