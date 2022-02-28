/*global GetParentResourceName*/
/*global $*/

import React from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const revertDuration = 100;

function elementFocus(focus) {
    fetch(`https://${GetParentResourceName()}/elementFocus`, {
        method: 'POST',
        body: JSON.stringify({ focus })
    });
}
class Input extends React.Component {
    render() {
        return <input {...this.props} onFocus={() => elementFocus(true)} onBlur={() => elementFocus(false)} />
    }
}


let dragged;
class Slot extends React.Component {
    // we use jquery-ui to make the element draggable. this isn't ideal, but for some reason the HTML5 drag and drop API doesn't work with NUI
    constructor(props) {
        super(props);
        this.state = {
            items: this.props.items || []
        };
        this.itemDraggable = false;
        this.itemref = React.createRef();
        this.slotref = React.createRef();
        this.drop = this.drop.bind(this);
    }

    getRawItems() {
        return this.state.items.map(item => item._id);
    }

    setItems(items) {
        this.itemDraggable = false;
        this.setState({
            items
        });
    }

    setItemDraggable() {
        $(this.itemref.current).draggable({
            revert: () => {
                if (dragged && !dragged.shop) {
                    setTimeout(() => {
                        this.setItems(dragged.from.state.items.concat(dragged.items));
                        dragged = null;
                    }, revertDuration);
                    return true;
                }
            },
            start: (event, ui) => {
                if (this.props.side === "right" && inventory.state.shop) {
                    let volume = this.state.items[0].stackable ? (inventory.moveVolume || 1) : 1;
                    let items = JSON.parse(JSON.stringify(this.state.items));
                    this.itemDraggable = false;
                    dragged = {
                        items,
                        from: this,
                        shop: true,
                        volume
                    };
                    ui.helper.html(`<p>${dragged.items[0].name}</p>
                        <p>x${volume}</p>`);
                } else {
                    let volume = this.state.items[0].stackable ? (inventory.moveVolume || Number.MAX_SAFE_INTEGER) : 1;
                    let items = this.state.items.slice(0, volume);
                    this.itemDraggable = false;
                    dragged = {
                        items,
                        from: this,
                        shop: false
                    };
                    this.setItems(this.state.items.slice(volume));
                    ui.helper.html(`<p>${dragged.items[0].name}</p>
                        <p>x${dragged.items.length}</p>`);
                }
            },
            helper: "clone",
            revertDuration: revertDuration
        });
        this.itemDraggable = true;
    }

    componentDidUpdate() {
        if (!this.itemDraggable) this.setItemDraggable();
    }

    drop(_, ui) {
        // TODO: add weight considerations
        if (dragged.shop) {
            if (!this.state.items[0] || (this.state.items[0].stackable && this.state.items[0].item_id === dragged.items[0].item_id)) { // valid move
                let cost = dragged.volume * dragged.items[0].cost;
                if (cost > inventory.state.cash) {
                    dragged = null;
                    // TODO: error message
                    return;
                }
                ui.helper.remove();
                inventory.setState({
                    cash: inventory.state.cash - cost
                });
                fetch(`https://${GetParentResourceName()}/cashChange`, {
                    method: 'POST',
                    body: JSON.stringify({ change: -cost })
                });
                fetch(`https://${GetParentResourceName()}/buyItems`, {
                    method: 'POST',
                    body: JSON.stringify({ items: new Array(dragged.volume).fill(dragged.items[0].item_id) })
                });

                let onEvent = (event) => {
                    let data = event.data;
                    if (data.action === 'bought_items') {
                        window.removeEventListener('message', onEvent);

                        let draggedItems = [];
                        let itemString = JSON.stringify(dragged.items[0]);
                        for (let i = 0; i < dragged.volume; i++) {
                            let item = JSON.parse(itemString);
                            item._id = data.items[i];
                            item.cost = undefined;
                            draggedItems.push(item);
                        }

                        if (!this.state.items[0]) { // dropped on an empty slot
                            this.setItems(draggedItems);
                        } else if (this.state.items[0].stackable && this.state.items[0].item_id === draggedItems[0].item_id) { // we are adding some extra items on the stackable items
                            this.setItems(this.state.items.concat(draggedItems));
                        }
                        this.props.updatedContents(this.props.container, this.props.index, this.state.items.map(item => item._id));
                        dragged = null;
                    }
                }
                window.addEventListener('message', onEvent);

            } else {
                // TODO: error message
                dragged = null;
            }
        } else {
            let draggedItems = dragged.items; // will definitely be some items otherwise they wouldn't be able to be dragged
            if (!this.state.items[0]) { // dropped on an empty slot
                this.setItems(draggedItems);
            } else if (this.state.items[0].stackable && this.state.items[0].item_id === draggedItems[0].item_id) { // we are adding some extra items on the stackable items
                this.setItems(this.state.items.concat(draggedItems));
            } else if (!dragged.from.state.items.length) { // no items left in the other slot so can perform a swap
                dragged.from.setItems(this.state.items);
                this.setItems(draggedItems);
            } else { // reject the drop, put items back
                dragged.from.setItems(dragged.from.state.items.concat(draggedItems));
            }
            this.props.updatedContents(this.props.container, this.props.index, this.state.items.map(item => item._id));
            dragged.from.props.updatedContents(dragged.from.props.container, dragged.from.props.index, dragged.from.state.items.map(item => item._id));
            dragged = null;
        }
    }

    componentDidMount() {
        this.setItemDraggable();
        $(this.slotref.current).droppable({
            drop: this.drop
        });
    }


    render() {
        return (
            <div className="slot" ref={this.slotref}>
                {this.state.items[0] &&
                    <div className="item" key={this.state.items[0]._id} ref={this.itemref} style={{ backgroundImage: `url("${this.state.items[0].icon}")` }} onClick={() => inventory.useItem(this.state.items[0])}>
                        <p>{this.state.items[0].name}</p>
                        {typeof this.state.items[0].cost === "number" ?
                            <p>${this.state.items[0].cost}</p> :
                            <p>x{this.state.items.length}</p>}
                    </div>}
            </div>
        )
    }
}


class Inventory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            inventory: [],
            container: [],
            itemPopups: [],
            shop: false
        };
        this.moveVolume = 0;
        this.rawInventory = {
            inventory: [],
            container: []
        };
        this.slotUpdatedContents = this.slotUpdatedContents.bind(this);
    }

    sendUpdatedInventory() {
        fetch(`https://${GetParentResourceName()}/updatedInventory`, {
            method: 'POST',
            body: JSON.stringify({ inventory: this.rawInventory })
        });
    }

    useItem(item) {
        fetch(`https://${GetParentResourceName()}/useItem`, {
            method: 'POST',
            body: JSON.stringify({ item })
        });
        fetch(`https://${GetParentResourceName()}/closeInventory`, {
            method: 'POST'
        });
        this.sendUpdatedInventory();
        this.setState({ visible: false });
    }

    slotUpdatedContents(container, index, newContents) {
        this.rawInventory[container][index] = newContents;
    }

    showItem(item) {
        item.removeID = Math.random();
        this.state.itemPopups.push(item);
        this.setState({ itemPopups: this.state.itemPopups });
        setTimeout(() => {
            this.setState({
                itemPopups: this.state.itemPopups.filter(it => it.removeID !== item.removeID)
            });
        }, 1000);
    }

    renderContainer(container, containerName) {
        let rendered = [];
        for (let i = 0; i < container.length; i++) {
            let slot = container[i];

            rendered.push(
                <Slot items={slot.items} index={i} container={containerName} updatedContents={this.slotUpdatedContents} side={containerName === "inventory" ? "left" : "right"} />
            )
        }

        return rendered;
    }

    renderItemPopups() {
        let rendered = [];
        for (let i = 0; i < this.state.itemPopups.length; i++) {
            let item = this.state.itemPopups[i];
            rendered.push(
                <div className="item" key={item._id} style={{ backgroundImage: `url("${item.icon}")` }}>
                    <p>{item.title}</p>
                    <p>{item.name}</p>
                </div>
            )
        }
        return rendered;
    }

    render() {
        return (
            <div>
                {this.state.visible &&
                    <div className="inventory">
                        <div className="inventory-left">{this.renderContainer(this.state.inventory, "inventory")}</div>
                        <div className="inventory-mid">
                            <Input type="number" step="1" placeholder='move' onChange={event => this.moveVolume = parseInt(event.target.value)} />
                        </div>
                        <div className="inventory-right">{this.renderContainer(this.state.container, "container")}</div>
                    </div>}
                {!this.state.visible &&
                    <div className="item-popups">
                        {this.renderItemPopups()}
                    </div>}

            </div>
        );
    }
}


const inventory = ReactDOM.render(
    <Inventory />,
    document.getElementById('root')
);

window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'disable_inventory') {
        inventory.sendUpdatedInventory();
        inventory.setState({
            visible: false
        });
    } else if (data.action === 'enable_inventory') {
        inventory.setState({
            visible: true,
            shop: data.shop
        });
    } else if (data.action === 'inventory') {
        inventory.rawInventory = {
            inventory: data.inventory.character.map(slot => slot.items.map(item => item._id)),
            container: data.inventory.container.map(slot => slot.items.map(item => item._id))
        };
        inventory.setState({
            inventory: data.inventory.character,
            container: data.inventory.container
        });
    } else if (data.action === 'showItem') {
        inventory.showItem(data.item);
    }
});

if (false) {
    setTimeout(() => {
        inventory.setState({
            visible: true,
            inventory: [
                {
                    items: [
                        { "_id": "6101cd98a5e1824a20b75314", "ammo": 0, "item_id": "weapon_pistol", "icon": "https://wiki.gtanet.work/images/thumb/9/9b/weapon_453432689.png/120px-weapon_453432689.png", "name": "Gun", "description": "Blam", "type": "weapon", "weapon_hash": "weapon_pistol", }
                    ]
                }, {
                    items: [{
                        "_id": "abc",
                        "item_id": "joint",
                        "icon": "https://us.123rf.com/450wm/sabelskaya/sabelskaya1812/sabelskaya181200054/113631725-vector-weed-joint-cannabis-spliff-hash-smoking-cigarette-sketch-icon-unhealthy-smoking-drug-addicati.jpg?ver=6",
                        "name": "Joint",
                        "description": "Smoke",
                        "type": "consumable",
                        "stackable": true
                    }, {
                        "_id": "abcde",
                        "item_id": "joint",
                        "icon": "https://us.123rf.com/450wm/sabelskaya/sabelskaya1812/sabelskaya181200054/113631725-vector-weed-joint-cannabis-spliff-hash-smoking-cigarette-sketch-icon-unhealthy-smoking-drug-addicati.jpg?ver=6",
                        "name": "Joint",
                        "description": "Smoke",
                        "type": "consumable",
                        "stackable": true
                    }]
                }, {
                    items: [{
                        "_id": "abcdef",
                        "item_id": "joint",
                        "icon": "https://us.123rf.com/450wm/sabelskaya/sabelskaya1812/sabelskaya181200054/113631725-vector-weed-joint-cannabis-spliff-hash-smoking-cigarette-sketch-icon-unhealthy-smoking-drug-addicati.jpg?ver=6",
                        "name": "Joint",
                        "description": "Smoke",
                        "type": "consumable",
                        "stackable": true
                    }]
                }, {
                    items: []
                }, {
                    items: []
                }, {
                    items: []
                }, {
                    items: []
                }, {
                    items: []
                }, {
                    items: []
                }, {
                    items: []
                },
            ],
            container: []
        });
    }, 500)
}
