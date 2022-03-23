import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { PedModel } from './peds';
import { spawnLocations } from './spawn_locations';
import ReactModal from 'react-modal';

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
const components = ["Face", "Mask", "Hair", "Torso", "Leg", "Parachute/bag", "Shoes", "Accessories", "Undershirt", "Kevlar", "Badge", "Torso 2"];
const props = ["Hat", "Glasses", "Earpiece", "Watch", "Bracelet"];
const faceFeatures = ["Node Width", "Nose Peak Height", "Nose Peak Length", "Nose Bone Height", "Nose Peak Lowering", "Nose Bone Twist", "Eye High", "Eye Forward", "Cheekbone Height", "Cheekbone Width", "Cheeks Width", "Eyes Open", "Lip Thickness", "Jaw Bone Width", "Jaw Bone Length", "Chin Bone Lowering", "Chin Bone Length", "Chin Bone Width", "Chin Dimple", "Neck Thickness"];
const headOverlay = ["Blemishes", "Facial Hair", "Eyebrows", "Ageing", "Makeup", "Blush", "Complexion", "Sun Damage", "Lipstick", "Moles/Freckles", "Chest Hair", "Body Blemishes", "Add Body Blemishes"];
const headOverlayWithColors = [1, 2, 5, 8, 10];

ReactModal.setAppElement('#root');

class CharacterSelection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            mode: "selection",
            selectedCharacter: 0,
            showDeleteModal: false,
            variations: {
                ped: [],
                pedProp: []
            },
            selectedVariations: {
                pedModel: "",
                ped: [],
                pedProp: []
            },
            clothingPage: "clothing",
        };
        this.characterCreation = {
            name: ""
        };
        this.characters = [];
    }

    setCharacters(characters) {
        this.characters = characters;
    }

    setVisible(visibility) {
        this.setState({
            visible: visibility,
            mode: "selection", // reset mode
            selectedCharacter: 0,
            showDeleteModal: false,
        })
    }

    setMode(mode) {
        this.setState({
            visible: this.state.visible,
            mode,
            selectedCharacter: 0,
            showDeleteModal: false,
        })
    }

    setSelectedCharacter(id) {
        this.setState({
            visible: this.state.visible,
            mode: this.state.mode,
            selectedCharacter: id,
            showDeleteModal: false,
        })
    }

    onPedChange(event) {
        let newPedModel = event.target.value;
        fetch(`https://${GetParentResourceName()}/updatedVariations`, {
            method: 'POST',
            body: JSON.stringify({ variations: { pedModel: newPedModel } })
        }).then(resp => resp.json()).then(variations => {
            let selectedVariations = {
                pedModel: newPedModel,
                ped: [],
                pedProp: [],
                headBlend: {
                    shapeFirstID: 0,
                    shapeSecondID: 0,
                    shapeThirdID: 0,
                    skinFirstID: 0,
                    skinSecondID: 0,
                    skinThirdID: 0,
                    shapeMix: 0,
                    skinMix: 0,
                    thirdMix: 0
                }
            };
            for (let componentIndex = 0; componentIndex < variations.ped.length; componentIndex++) {
                selectedVariations.ped.push([0, 0]);
            }
            for (let propIndex = 0; propIndex < variations.pedProp.length; propIndex++) {
                selectedVariations.pedProp.push([-1, 0]);
            }
            this.setState({ variations, selectedVariations });
            this.sendUpdatedVariations();
        });
    }
    onNameChange(event) {
        this.characterCreation.name = event.target.value;
    }
    finishCreation() {
        fetch(`https://${GetParentResourceName()}/finishNewCharacter`, {
            method: 'POST',
            body: JSON.stringify(this.characterCreation)
        });
        this.setCamera(null);
    }

    newCharacter() {
        this.setMode("new_character");
        this.setState({
            selectedVariations: {
                pedModel: "",
                ped: [],
                pedProp: []
            }, variations: {
                ped: [],
                pedProp: []
            }
        });
        fetch(`https://${GetParentResourceName()}/newCharacter`, {
            method: 'POST'
        });
    }

    handleOpenDeleteModal() {
        this.setState({
            visible: this.state.visible,
            mode: this.state.mode,
            selectedCharacter: this.state.selectedCharacter,
            showDeleteModal: true,
        })
    }
    handleCloseDeleteModal() {
        this.setState({
            visible: this.state.visible,
            mode: this.state.mode,
            selectedCharacter: this.state.selectedCharacter,
            showDeleteModal: false,
        })
    }

    deleteCharacter() {
        fetch(`https://${GetParentResourceName()}/deleteCharacter`, {
            method: 'POST',
            body: JSON.stringify({ character: this.state.selectedCharacter })
        });
    }
    selectCharacter() {
        this.setState({
            visible: this.state.visible,
            mode: "select_spawn",
            selectedCharacter: this.state.selectedCharacter,
            showDeleteModal: false
        });
    }

    sendUpdatedVariations() {
        fetch(`https://${GetParentResourceName()}/updatedVariations`, {
            method: 'POST',
            body: JSON.stringify({ variations: this.state.selectedVariations })
        });
    }

    saveClothing() {
        fetch(`https://${GetParentResourceName()}/saveClothing`, {
            method: 'POST'
        });
        this.setCamera(null);
        this.setVisible(false);
    }
    cancelClothing() {
        fetch(`https://${GetParentResourceName()}/cancelClothing`, {
            method: 'POST'
        });
        this.setCamera(null);
        this.setVisible(false);
    }

    setCamera(camera) {
        fetch(`https://${GetParentResourceName()}/camera`, {
            method: 'POST',
            body: JSON.stringify({ camera })
        });
    }

    render() {
        if (!this.state.visible) return null;

        if (this.state.mode === "selection") {
            return (
                <div id="char-selection">
                    <div className="character-boxes">
                        {this.characters.slice(0, 5).map(char => <div className="character-box" key={char._id} onClick={() => this.setSelectedCharacter(char.cid)} />)}
                    </div>
                    <div className="buttons">
                        <button className={"button-green " + (this.state.selectedCharacter ? "" : "disabled")} onClick={() => this.selectCharacter()}>Select character</button>
                        <button className="new-character" onClick={() => this.newCharacter()}>New Character</button>
                        <button className={"button-red " + (this.state.selectedCharacter ? "" : "disabled")} onClick={() => this.handleOpenDeleteModal()}>Delete character</button>
                    </div>
                    <ReactModal
                        isOpen={this.state.showDeleteModal}
                        className="modal"
                        overlayClassName="overlay"
                    >
                        <h2>Are you sure you want to delete this character?</h2>
                        <div className="buttons">
                            <button className="button-green" onClick={() => this.deleteCharacter()}>Yes</button>
                            <button className="button-red" onClick={() => this.handleCloseDeleteModal()}>No</button>
                        </div>
                    </ReactModal>
                </div>
            );
        } else if (this.state.mode === "new_character" || this.state.mode === "clothing") {
            let pedCustomisation = [];
            if (this.state.clothingPage === "clothing") {
                pedCustomisation.push(
                    <p>
                        Ped:
                        <select onChange={e => this.onPedChange(e)}>
                            {Object.keys(PedModel).map(ped => <option value={ped} key={ped} selected={this.state.selectedVariations.pedModel === ped ? "selected" : false}>{ped}</option>)}
                        </select>
                    </p>
                );
                for (let componentIndex = 0; componentIndex < this.state.variations.ped.length; componentIndex++) {
                    let component = this.state.variations.ped[componentIndex]; // list of variations, each is a number of textures
                    let updateVariation = e => {
                        let newVariation = parseInt(e.target.value);
                        this.state.selectedVariations.ped[componentIndex] = [newVariation, 0];
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateTexture = e => {
                        let newTexture = parseInt(e.target.value);
                        this.state.selectedVariations.ped[componentIndex][1] = newTexture;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    pedCustomisation.push(
                        <p>
                            {components[componentIndex]}:
                            {component.length} variations
                            <input type="number" onChange={updateVariation} style={{ width: "100px" }} value={this.state.selectedVariations.ped[componentIndex][0]} min="0" max={component.length - 1} />
                            {component[this.state.selectedVariations.ped[componentIndex][0]]} textures
                            <input type="number" onChange={updateTexture} style={{ width: "100px" }} value={this.state.selectedVariations.ped[componentIndex][1]} min="0" max={component[this.state.selectedVariations.ped[componentIndex][0]] - 1} />
                        </p>
                    )
                }
                for (let propIndex = 0; propIndex < this.state.variations.pedProp.length; propIndex++) {
                    let prop = this.state.variations.pedProp[propIndex]; // list of variations, each is a number of textures
                    let updateVariation = e => {
                        let newVariation = parseInt(e.target.value);
                        this.state.selectedVariations.pedProp[propIndex] = [newVariation, 0];
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateTexture = e => {
                        let newTexture = parseInt(e.target.value);
                        this.state.selectedVariations.pedProp[propIndex][1] = newTexture;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    pedCustomisation.push(
                        <p>
                            {props[propIndex]}:
                            {prop.length} variations
                            <input type="number" onChange={updateVariation} style={{ width: "100px" }} value={this.state.selectedVariations.pedProp[propIndex][0]} min="-1" max={prop.length - 1} />
                            {prop[this.state.selectedVariations.pedProp[propIndex][0]]} textures
                            <input type="number" onChange={updateTexture} style={{ width: "100px" }} value={this.state.selectedVariations.pedProp[propIndex][1]} min="0" max={prop[this.state.selectedVariations.pedProp[propIndex][0]] - 1} />
                        </p>
                    )
                }
            }
            if (this.state.clothingPage === "head") {
                pedCustomisation.push(
                    <p style={{ backgroundColor: "white" }}>
                        Face:
                    </p>
                );
                let updateHeadBlend = key => {
                    return (e) => {
                        let newValue = parseFloat(e.target.value);
                        this.state.selectedVariations.headBlend[key] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    }
                };
                pedCustomisation.push(
                    <p>
                        Shape first:
                        <input type="number" onChange={updateHeadBlend("shapeFirstID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["shapeFirstID"]} min="0" max="45" />
                        Shape second:
                        <input type="number" onChange={updateHeadBlend("shapeSecondID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["shapeSecondID"]} min="0" max="45" />
                        Shape third:
                        <input type="number" onChange={updateHeadBlend("shapeThirdID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["shapeThirdID"]} min="0" max="45" />
                    </p>,
                    <p>
                        Skin first:
                        <input type="number" onChange={updateHeadBlend("skinFirstID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["skinFirstID"]} min="0" max="45" />
                        Skin second:
                        <input type="number" onChange={updateHeadBlend("skinSecondID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["skinSecondID"]} min="0" max="45" />
                        Skin third:
                        <input type="number" onChange={updateHeadBlend("skinThirdID")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["skinThirdID"]} min="0" max="45" />
                    </p>,
                    <p >
                        Shape mix:
                        <input type="number" onChange={updateHeadBlend("shapeMix")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["shapeMix"]} min="0" max="1" step="0.01" />
                        Skin mix:
                        <input type="number" onChange={updateHeadBlend("skinMix")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["skinMix"]} min="0" max="1" step="0.01" />
                        Thid mix:
                        <input type="number" onChange={updateHeadBlend("thirdMix")} style={{ width: "100px" }} value={this.state.selectedVariations.headBlend["thirdMix"]} min="0" max="1" step="0.01" />
                    </p>
                );
                pedCustomisation.push(
                    <p style={{ backgroundColor: "white" }}>
                        Face features:
                    </p>
                );
                for (let faceFeature = 0; faceFeature < 20; faceFeature++) {
                    let updatedFeature = e => {
                        let newValue = parseFloat(e.target.value);
                        this.state.selectedVariations.face[faceFeature] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    pedCustomisation.push(
                        <p>
                            {faceFeatures[faceFeature]}:
                            <input type="number" onChange={updatedFeature} style={{ width: "100px" }} value={this.state.selectedVariations.face[faceFeature]} min="-1" max="1" step="0.1" />
                        </p>
                    );
                }
            }
            if (this.state.clothingPage === "face") {
                let updateHairColor = index => {
                    return (e) => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.hairColor[index] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    }
                };
                pedCustomisation.push(
                    <p>
                        Hair Color:
                        <input type="number" onChange={updateHairColor(0)} style={{ width: "100px" }} value={this.state.selectedVariations.hairColor[0]} min="0" max="63" />
                        <input type="number" onChange={updateHairColor(1)} style={{ width: "100px" }} value={this.state.selectedVariations.hairColor[1]} min="0" max="63" />
                    </p>
                );
                for (let overlayID = 0; overlayID < this.state.variations.headOverlay.length; overlayID++) {
                    let overlayIndexNumber = this.state.variations.headOverlay[overlayID];
                    let overlayHasColor = headOverlayWithColors.includes(overlayID);
                    let updateVariation = e => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.headOverlay[overlayID] = overlayHasColor ? [newValue, 255, 0, 0] : [newValue, 255];
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateOpacity = e => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.headOverlay[overlayID][1] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateColorOne = e => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.headOverlay[overlayID][2] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateColorTwo = e => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.headOverlay[overlayID][3] = newValue;
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    pedCustomisation.push(
                        <p>
                            {headOverlay[overlayID]}:
                            {overlayIndexNumber} variations
                            <input type="number" onChange={updateVariation} style={{ width: "100px" }} value={this.state.selectedVariations.headOverlay[overlayID][0]} min="-1" max={overlayIndexNumber - 1} />
                            Opacity:
                            <input type="number" onChange={updateOpacity} style={{ width: "100px" }} value={this.state.selectedVariations.headOverlay[overlayID][1]} min="0" max="255" />
                            {overlayHasColor && <br />}
                            {overlayHasColor && "Main Color:"}
                            {overlayHasColor && <input type="number" onChange={updateColorOne} style={{ width: "100px" }} value={this.state.selectedVariations.headOverlay[overlayID][2]} min="0" max="63" />}
                            {overlayHasColor && "Secondary Color:"}
                            {overlayHasColor && <input type="number" onChange={updateColorTwo} style={{ width: "100px" }} value={this.state.selectedVariations.headOverlay[overlayID][3]} min="0" max="63" />}
                        </p>
                    )
                }
            }
            let rightMenu = [];
            if (this.state.mode === "new_character") {
                rightMenu.push(
                    <p>Name: <input onChange={e => this.onNameChange(e)}></input></p>
                );
                rightMenu.push(
                    <button onClick={() => this.finishCreation()}>Create Character</button>
                );
            } else if (this.state.mode === "clothing") {
                rightMenu.push(
                    <button onClick={() => this.saveClothing()}>Save</button>
                );
                rightMenu.push(
                    <button onClick={() => this.cancelClothing()}>Cancel</button>
                );
            }
            return (
                <div id="char-creation">
                    <div id="ped-selection">
                        <p>
                            Camera:
                            <button onClick={() => this.setCamera("face")}>Face</button>
                            <button onClick={() => this.setCamera(null)}>Default</button>
                        </p>
                        <p>
                            Page:
                            <button onClick={() => this.setState({ clothingPage: "clothing" })}>Clothing</button>
                            <button onClick={() => this.setState({ clothingPage: "head" })}>Head</button>
                            <button onClick={() => this.setState({ clothingPage: "face" })}>Face</button>
                        </p>
                        {pedCustomisation}
                    </div>
                    <div id="char-attributes">
                        {rightMenu}
                    </div>
                </div>
            )
        } else if (this.state.mode === "select_spawn") {
            const buttons = Object.keys(spawnLocations).map(location => {
                const styles = {
                    left: `${map(spawnLocations[location].y, -4242, 8420, 2407, 153) + 10}px`,
                    top: `${map(spawnLocations[location].x, -3430, 4444, 1440, 0) + 10}px`,
                    position: "absolute",
                    border: "none",
                    height: "20px",
                    width: "20px",
                    borderRadius: "20px",
                    backgroundColor: "red"
                };
                let click = () => {
                    this.setVisible(false);
                    fetch(`https://${GetParentResourceName()}/selectedCharacter`, {
                        method: 'POST',
                        body: JSON.stringify({ character: this.state.selectedCharacter, location: spawnLocations[location] })
                    });
                }
                return <button style={styles} onClick={click}></button>
            });
            return (
                <div id="char-selection" className="city-map">
                    {buttons}
                </div>
            )
        }
    }
}

const selection = ReactDOM.render(
    <CharacterSelection />,
    document.getElementById('root')
);

console.log("listener set up");
window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'enable_screen' || data.action === "disable_screen") {
        if (data.action === "enable_screen") {
            selection.setCharacters(event.data.characters);
        }
        selection.setVisible(data.action === "enable_screen");
    } else if (data.action === 'clothing') {
        selection.setVisible(true);
        selection.setState({
            selectedVariations: data.selectedVariations,
            variations: data.variations,
        });
        selection.setMode("clothing");
    }
});
fetch(`https://${GetParentResourceName()}/ready`, {
    method: 'POST'
});
