/*global GetParentResourceName*/
/*global $*/

import React from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const revertDuration = 100;

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
                if (dragged) {
                    setTimeout(() => {
                        this.setItems(dragged.from.state.items.concat(dragged.items));
                        dragged = null;
                    }, revertDuration);
                    return true;
                }
            },
            start: (event, ui) => {
                let volume = inventory.moveVolume || Number.MAX_SAFE_INTEGER;
                let items = this.state.items.slice(0, volume);
                this.itemDraggable = false;
                dragged = {
                    items,
                    from: this
                };
                this.setItems(this.state.items.slice(volume));
                ui.helper.text(`x${dragged.items.length}`);
            },
            helper: "clone",
            revertDuration: revertDuration
        });
        this.itemDraggable = true;
    }

    componentDidUpdate() {
        if (!this.itemDraggable) this.setItemDraggable();
    }

    componentDidMount() {
        this.setItemDraggable();
        $(this.slotref.current).droppable({
            drop: () => {
                // TODO: add weight considerations
                let draggedItems = dragged.items; // will definitely be some items otherwise they wouldn't be able to be dragged
                if (!this.state.items[0]) { // dropped on an empty slot
                    console.log(1);
                    this.setItems(draggedItems);
                } else if (this.state.items[0].stackable && this.state.items[0].item_id === draggedItems[0].item_id) { // we are adding some extra items on the stackable items
                    console.log(2);
                    this.setItems(this.state.items.concat(draggedItems));
                } else if (!dragged.from.state.items.length) { // no items left in the other slot so can perform a swap
                    console.log(3);
                    dragged.from.setItems(this.state.items);
                    this.setItems(draggedItems);
                } else { // reject the drop, put items back
                    console.log(4);
                    dragged.from.setItems(dragged.from.state.items.concat(draggedItems));
                }
                this.props.updatedContents(this.props.container, this.props.index, this.state.items.map(item => item._id));
                dragged.from.props.updatedContents(dragged.from.props.container, dragged.from.props.index, dragged.from.state.items.map(item => item._id));
                dragged = null;
            }
        });
    }


    render() {
        return (
            <div className="slot" ref={this.slotref}>
                {this.state.items[0] &&
                    <div className="item" key={this.state.items[0]._id} ref={this.itemref} style={{ backgroundImage: `url("${this.state.items[0].icon}")` }} onClick={() => inventory.useItem(this.state.items[0])}>
                        x{this.state.items.length}
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
            container: []
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

    renderContainer(container, containerName) {
        let rendered = [];
        for (let i = 0; i < container.length; i++) {
            let slot = container[i];

            rendered.push(
                <Slot items={slot.items} index={i} container={containerName} updatedContents={this.slotUpdatedContents} />
            )
        }

        return rendered;
    }

    render() {
        if (!this.state.visible) return null;

        return (
            <div>
                <div className="inventory">
                    <div className="inventory-left">{this.renderContainer(this.state.inventory, "inventory")}</div>
                    <div className="inventory-mid">
                        <input type="number" step="1" placeholder='move' onChange={event => this.moveVolume = parseInt(event.target.value)} />
                    </div>
                    <div className="inventory-right">{this.renderContainer(this.state.container, "container")}</div>
                </div>
                <div className="equip-item">Equipped</div>
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
            visible: true
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
