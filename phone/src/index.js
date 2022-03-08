import React from 'react';
import ReactDOM from 'react-dom';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function elementFocus(focus) {
    fetch(`https://${GetParentResourceName()}/elementFocus`, {
        method: 'POST',
        body: JSON.stringify({ focus })
    });
}

const TooltipHover = ({ id, children, title }) => (
    <OverlayTrigger overlay={<Tooltip id={id}>{title}</Tooltip>} popperConfig={{
        modifiers: [
            {
                name: 'preventOverflow',
                options: {
                    boundary: document.querySelector('.phone-screen'),
                },
            },
        ],
    }}>
        {children}
    </OverlayTrigger>
)

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

class Phone extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            up: false,
            page: ["home"],
            contacts: [],
            time: {
                hours: -1,
                minutes: -1
            },
            smsOverview: [],
            task: {
                steps: []
            },
            notifications: []
        };
        this.contactsLoaded = false;
    }

    pullUp() {
        this.setState({
            up: true,
            page: ["home"]
        });
    }
    pullDown() {
        this.setState({
            up: false,
            page: ["home"]
        });
    }

    setPage(pages) {
        this.setState({
            page: pages
        });
        if (pages[0] === "contacts") {
            this.setState({
                contacts: []
            });
            this.loadContacts();
        } else if (pages[0] === "sms") {
            this.setState({
                smsMessages: null
            });
            if (!this.contactsLoaded) {
                this.loadContacts();
            }
            if (pages[1]) {
                this.loadSMSMessages(pages[1]);
            } else {
                this.loadSMSOverview();
            }
        }
    }

    loadContacts() {
        fetch(`https://${GetParentResourceName()}/loadContacts`, {
            method: 'POST'
        });
    }

    addContact() {
        fetch(`https://${GetParentResourceName()}/addContact`, {
            method: 'POST',
            body: JSON.stringify({ name: this.state.modal.contactName, number: this.state.modal.contactNumber })
        });
        this.setState({ modal: null });
    }

    removeContact(number) {
        fetch(`https://${GetParentResourceName()}/removeContact`, {
            method: 'POST',
            body: JSON.stringify({ number })
        });
    }

    contactProcessed() {
        if (this.state.page[0] === "contacts") {
            this.loadContacts();
        }
    }

    loadSMSOverview() {
        fetch(`https://${GetParentResourceName()}/loadSMSOverview`, {
            method: 'POST'
        });
    }

    loadSMSMessages(number) {
        fetch(`https://${GetParentResourceName()}/loadSMSMessages`, {
            method: 'POST',
            body: JSON.stringify({ number })
        });
    }

    copy(text) {
        let node = document.createElement('textarea');
        let selection = document.getSelection();

        node.textContent = text;
        document.body.appendChild(node);

        selection.removeAllRanges();
        node.select();
        document.execCommand('copy');

        selection.removeAllRanges();
        document.body.removeChild(node);
    }

    sendSMS(number, content) {
        fetch(`https://${GetParentResourceName()}/sendSMS`, {
            method: 'POST',
            body: JSON.stringify({ number, content })
        });
    }

    resolveContactName(number) {
        let contact = this.state.contacts.find(c => c.phoneNumber === number);
        return contact ? contact.name : number;
    }

    incomingNotification(notification) {
        notification.removeID = Math.random();
        notification.hiding = false;
        notification.showing = false;
        this.state.notifications.push(notification);
        this.setState({ notifications: this.state.notifications });
        setTimeout(() => {
            notification.showing = true;
            this.setState({
                notifications: this.state.notifications
            });
        }, 10);
        setTimeout(() => {
            notification.hiding = true;
            this.setState({
                notifications: this.state.notifications
            });
        }, 2000);
        setTimeout(() => {
            this.setState({
                notifications: this.state.notifications.filter(it => it.removeID !== notification.removeID)
            });
        }, 3000);
    }

    getMidSection() {
        if (this.state.page[0] === "home") {
            return (
                <div className="mid-section apps">
                    <TooltipHover title="Text Messages">
                        <div className="app" onClick={() => this.setPage(["sms"])}><i class="fas fa-comment-alt"></i></div>
                    </TooltipHover>
                    <TooltipHover title="Phone Calls">
                        <div className="app"><i class="fas fa-phone"></i></div>
                    </TooltipHover>
                    <TooltipHover title="Contacts">
                        <div className="app" onClick={() => this.setPage(["contacts"])}><i class="fas fa-address-book"></i></div>
                    </TooltipHover>
                    <TooltipHover title="Information">
                        <div className="app"><i class="fas fa-info-circle"></i></div>
                    </TooltipHover>
                    <TooltipHover title="Task">
                        <div className="app" onClick={() => this.setPage(["task"])}><i class="fas fa-tasks"></i></div>
                    </TooltipHover>
                </div>
            )
        } else if (this.state.page[0] === "contacts") {
            let contacts = [];
            for (let i = 0; i < this.state.contacts.length; i++) {
                let contact = this.state.contacts[i];
                contacts.push(
                    <div className="contact" onMouseOver={() => this.setState({ contactHovered: i })} onMouseLeave={() => this.setState({ contactHovered: -1 })}>
                        <div className="contact-left">
                            <p>{contact.name}</p>
                        </div>
                        {this.state.contactHovered === i &&
                            <div className="contact-right">
                                <TooltipHover title="Remove Contact">
                                    <p onClick={() => this.removeContact(contact.phoneNumber)}><i class="fas fa-user-slash"></i></p>
                                </TooltipHover>
                                <TooltipHover title="Copy Number">
                                    <p onClick={() => this.copy(contact.phoneNumber)}><i class="fas fa-copy"></i></p>
                                </TooltipHover>
                                <TooltipHover title="Text User">
                                    <p onClick={() => this.setPage(["sms", contact.phoneNumber])}><i class="fas fa-comment-alt"></i></p>
                                </TooltipHover>
                            </div>
                        }
                    </div>
                )
            }
            return (
                <div className="mid-section contacts">
                    <div className="contacts-upper">
                        <TooltipHover title="Add Contact">
                            <p data-tip="Add Contact" onClick={() => this.setState({ modal: { type: "add_contact" } })}><i class="fas fa-user-plus"></i></p>
                        </TooltipHover>
                    </div>
                    <div className="contacts-main">
                        {contacts}
                    </div>
                </div>
            )
        } else if (this.state.page[0] === "sms") {
            let other = this.state.page[1];
            if (other) {
                let theirNumber = other;
                let theirName = this.resolveContactName(theirNumber);

                let messages = [];
                if (this.state.smsMessages) {
                    for (let i = 0; i < this.state.smsMessages.length; i++) {
                        let message = this.state.smsMessages[i];
                        let from = message.from === theirNumber ? "them" : "us";
                        messages.push(
                            <div className={`sms-message from-${from}`}>
                                <p>{message.content}</p>
                                <p>{message.at}</p>
                            </div>
                        )
                    }
                }

                return (
                    <div className="mid-section sms-thread">
                        <div className="sms-thread-upper">
                            <p>{theirName}</p>
                        </div>
                        <div className="sms-thread-main">
                            {messages}
                        </div>
                        <div classname="sms-thread-lower">
                            <Input className="form-control" type="text" onEnter={val => this.sendSMS(other, val)} clearOnEnter="true" />
                        </div>
                    </div>
                )
            } else {
                let threads = [];
                for (let i = 0; i < this.state.smsOverview.length; i++) {
                    let thread = this.state.smsOverview[i];
                    // from and to depends on who sent it. also need to match a contact
                    threads.push(
                        <div className="sms-thread-overview" onClick={() => this.setPage(["sms", thread.number])}>
                            <p>{this.resolveContactName(thread.number)}</p>
                            <p>{thread.mostRecentMessage}</p>
                        </div>
                    );
                }
                return (
                    <div className="mid-section sms">
                        {threads}
                    </div>
                )
            }
        } else if (this.state.page[0] === "task") {
            let steps = [];
            for (let i = 0; i < this.state.task.steps.length; i++) {
                let step = this.state.task.steps[i];
                let icon;
                if (step.state === 0) { // to do
                    icon = <i class="fas fa-ellipsis-h"></i>;
                } else if (step.state === 1) { // in progress
                    icon = <i class="fas fa-clock"></i>;
                } else if (step.state === 2) { // done
                    icon = <i class="fas fa-check-circle"></i>;
                }
                steps.push(
                    <div className="step">
                        <p>{icon} <b>{step.heading}</b></p>
                        {step.body && <p>{step.body}</p>}
                    </div>
                );
            }
            return (
                <div className="mid-section task">
                    {steps}
                </div>
            )
        }
    }

    render() {
        let modal;
        if (this.state.modal) {
            modal = <div className="phone-modal">
                <div className="phone-modal-content">
                    <h2>Add Contact</h2>
                    <label>Name: <Input type="text" className="form-control" onChange={event => this.setState(prevState => ({ modal: { ...prevState.modal, contactName: event.target.value } }))} /></label>
                    <label>Number: <Input type="number" className="form-control" onChange={event => this.setState(prevState => ({ modal: { ...prevState.modal, contactNumber: parseInt(event.target.value) } }))} /></label>
                    <div>
                        <button className="btn btn-secondary" onClick={() => this.setState({ modal: null })}>Close</button>
                        <button className="btn btn-primary" onClick={() => this.addContact()}>Add contact</button>
                    </div>
                </div>
            </div>;
        }

        let notifications = [];
        let notHidingIndex = 0;
        for (let i = 0; i < this.state.notifications.length; i++) {
            let notification = this.state.notifications[i];

            let top = notification.hiding || !notification.showing ? -60 : notHidingIndex * 60;

            notifications.push(
                <div className="notification" style={{ top: `${top}px` }} key={notification.removeID}>
                    <p>{notification.title}</p>
                </div>
            );
            if (!notification.hiding) notHidingIndex++;
        }

        let bottom = "-900px";
        if (this.state.up) bottom = "0px";
        else if (this.state.notifications.length) bottom = "-700px";
        return (
            <div className="phone" style={{ bottom }}>
                <div className="phone-screen">
                    {modal}
                    <div className="notifications">
                        {notifications}
                    </div>
                    <div className="status-bar">
                        <div className="status-left">
                            <p>{String(this.state.time.hours).padStart(2, '0')}:{String(this.state.time.minutes).padStart(2, '0')}</p>
                        </div>
                        <div className="status-right">
                            <p><i class="fas fa-wifi"></i></p>
                            <p><i class="fas fa-signal"></i></p>
                            <p><i class="fas fa-battery-three-quarters"></i></p>
                        </div>
                    </div>
                    {this.getMidSection()}
                    <div className="navigation">
                        <p onClick={() => this.setPage(["home"])}><i class="far fa-circle"></i></p>
                    </div>
                </div>
            </div>
        );
    }
}


const phone = ReactDOM.render(
    <Phone />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action == 'open_phone') {
        phone.pullUp();
    } else if (data.action === "close_phone") {
        phone.setState({ modal: null });
        phone.pullDown();
    } else if (data.action === "contact_processed") {
        phone.contactProcessed();
    } else if (data.action === "contacts") {
        phone.contactsLoaded = true;
        phone.setState({ contacts: data.contacts });
    } else if (data.action === "time") {
        phone.setState({ time: data.time });
    } else if (data.action === "smsOverview") {
        phone.setState({ smsOverview: data.overview });
    } else if (data.action === "smsMessages") {
        phone.setState({ smsMessages: data.messages });
    } else if (data.action === "task") {
        phone.setState({
            task: data.task
        });
    } else if (data.action === "notification") {
        phone.incomingNotification(data.notification);
    }
});
