import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Phone extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            up: false,
        };
    }

    pullUp() {
        this.setState({
            up: true,
        });
    }
    pullDown() {
        this.setState({
            up: false
        });
    }

    render() {
        if (!this.state.up) return null;
        return (
            <div className="phone"></div>
        );
    }
}

const phone = ReactDOM.render(
    <Phone />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action == 'enable_phone') {
        phone.pullUp();
    }
});

document.addEventListener('keydown', e => {
    if (e.code === "KeyO") {
        phone.pullDown();
        fetch(`https://${GetParentResourceName()}/nuiFocusOff`, {
            method: 'POST'
        });
    }
});
