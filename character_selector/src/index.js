import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PedModel } from './peds';
import { spawnLocations } from './spawn_locations';
import ReactModal from 'react-modal';

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
const components = ["Face", "Mask", "Hair", "Torso", "Leg", "Parachute/bag", "Shoes", "Accessories", "Undershirt", "Kevlar", "Badge", "Torso 2"];
const props = ["Hat", "Glasses", "Earpiece", "Watch", "Bracelet"];
const faceFeatures = ["Nose Width", "Nose Peak Height", "Nose Peak Length", "Nose Bone Height", "Nose Peak Lowering", "Nose Bone Twist", "Eyebrow Height", "Eyebrow Depth", "Cheekbone Height", "Cheekbone Width", "Cheek Width", "Eye Squint", "Lips Thickness", "Jaw Bone Width", "Jaw Bone Length", "Chin Bone Height", "Chin Bone Length", "Chin Bone Width", "Chin Cleft", "Neck Thickness"];
const headOverlay = ["Blemishes", "Facial Hair", "Eyebrows", "Ageing", "Makeup", "Blush", "Complexion", "Sun Damage", "Lipstick", "Moles/Freckles", "Chest Hair", "Body Blemishes", "Add Body Blemishes"];
const headOverlayWithColors = [1, 2, 5, 8, 10];

ReactModal.setAppElement('#root');

class CharacterSelection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            mode: "selection",
            previousMode: "",
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
            camera: null,
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
                },
                face: [],
                hairColor: [0, 0],
                headOverlay: [],
            };
            for (let componentIndex = 0; componentIndex < variations.ped.length; componentIndex++) {
                selectedVariations.ped.push([0, 0]);
            }
            for (let propIndex = 0; propIndex < variations.pedProp.length; propIndex++) {
                selectedVariations.pedProp.push([-1, 0]);
            }
            for (let overlayID = 0; overlayID < variations.headOverlay.length; overlayID++) {
                let overlayHasColor = headOverlayWithColors.includes(overlayID);
                selectedVariations.headOverlay.push(overlayHasColor ? [-1, 1, 0, 0] : [-1, 1]);
            }
            this.setState({ variations, selectedVariations, camera: null });
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
        this.setCamera(null);
        if (this.state.previousMode === "clothing") {
            fetch(`https://${GetParentResourceName()}/saveClothing`, {
                method: 'POST'
            });
            this.setVisible(false);
        } else {
            this.finishCreation();
        }
    }
    cancelClothing() {
        this.setCamera(null);
        if (this.state.previousMode === "clothing") {
            fetch(`https://${GetParentResourceName()}/cancelClothing`, {
                method: 'POST'
            });
            this.setVisible(false);
        } else {
            fetch(`https://${GetParentResourceName()}/discardNew`, {
                method: 'POST'
            });
        }
    }

    setCamera(camera) {
        fetch(`https://${GetParentResourceName()}/camera`, {
            method: 'POST',
            body: JSON.stringify({ camera })
        });
        this.setState({ camera });
        document.activeElement.blur();
    }

    escapePressed() {
        if (this.state.mode === "clothing" || this.state.mode === "new_character") {
            this.setState({ mode: "clothing_quit", previousMode: this.state.mode });
        }
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
                        className="delete-modal"
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
        } else if (this.state.mode === "clothing_quit") {
            return (
                <div className='quitClothing'>
                    <div>
                        <p>Are you sure you want to exit the {this.state.previousMode === "clothing" ? "clothing" : "character creation"} menu?</p>
                        <div className='btn-group'>
                            <button className='btn btn-lg btn-primary' onClick={() => this.saveClothing()}>{this.state.previousMode === "clothing" ? "Save" : "Create Character"}</button>
                            <button className='btn btn-lg btn-primary' onClick={() => this.cancelClothing()}>{this.state.previousMode === "clothing" ? "Cancel" : "Discard Character"}</button>
                            <button className='btn btn-lg btn-primary' onClick={() => this.setState({ mode: this.state.previousMode })}>Go Back</button>
                        </div>
                    </div>
                </div>
            )
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
                            <b>{components[componentIndex]}:</b>&nbsp;
                            {component.length} variations&nbsp;
                            <input type="number" onChange={updateVariation} value={this.state.selectedVariations.ped[componentIndex][0]} min="0" max={component.length - 1} />&nbsp;
                            {component[this.state.selectedVariations.ped[componentIndex][0]]} textures&nbsp;
                            <input type="number" onChange={updateTexture} value={this.state.selectedVariations.ped[componentIndex][1]} min="0" max={component[this.state.selectedVariations.ped[componentIndex][0]] - 1} />
                        </p>
                    )
                }
                pedCustomisation.push(<br />);
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
                            <b>{props[propIndex]}:</b>&nbsp;
                            {prop.length} variations&nbsp;
                            <input type="number" onChange={updateVariation} value={this.state.selectedVariations.pedProp[propIndex][0]} min="-1" max={prop.length - 1} />&nbsp;
                            {prop[this.state.selectedVariations.pedProp[propIndex][0]]} textures&nbsp;
                            <input type="number" onChange={updateTexture} value={this.state.selectedVariations.pedProp[propIndex][1]} min="0" max={prop[this.state.selectedVariations.pedProp[propIndex][0]] - 1} />
                        </p>
                    )
                }
            }
            if (this.state.clothingPage === "head") {
                pedCustomisation.push(
                    <h2>
                        Parents:
                    </h2>
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
                        <b>Shape:</b> First:&nbsp;
                        <input type="number" onChange={updateHeadBlend("shapeFirstID")} value={this.state.selectedVariations.headBlend["shapeFirstID"]} min="0" max="45" />&nbsp;
                        Second:&nbsp;
                        <input type="number" onChange={updateHeadBlend("shapeSecondID")} value={this.state.selectedVariations.headBlend["shapeSecondID"]} min="0" max="45" />&nbsp;
                        Third:&nbsp;
                        <input type="number" onChange={updateHeadBlend("shapeThirdID")} value={this.state.selectedVariations.headBlend["shapeThirdID"]} min="0" max="45" />
                    </p>,
                    <p>
                        <b>Skin:</b> First:&nbsp;
                        <input type="number" onChange={updateHeadBlend("skinFirstID")} value={this.state.selectedVariations.headBlend["skinFirstID"]} min="0" max="45" />&nbsp;
                        Second:&nbsp;
                        <input type="number" onChange={updateHeadBlend("skinSecondID")} value={this.state.selectedVariations.headBlend["skinSecondID"]} min="0" max="45" />&nbsp;
                        Third:&nbsp;
                        <input type="number" onChange={updateHeadBlend("skinThirdID")} value={this.state.selectedVariations.headBlend["skinThirdID"]} min="0" max="45" />
                    </p>,
                    <p >
                        Shape mix:&nbsp;
                        <input type="number" onChange={updateHeadBlend("shapeMix")} value={this.state.selectedVariations.headBlend["shapeMix"]} min="0" max="1" step="0.01" />&nbsp;
                        Skin mix:&nbsp;
                        <input type="number" onChange={updateHeadBlend("skinMix")} value={this.state.selectedVariations.headBlend["skinMix"]} min="0" max="1" step="0.01" />&nbsp;
                        Thid mix:&nbsp;
                        <input type="number" onChange={updateHeadBlend("thirdMix")} value={this.state.selectedVariations.headBlend["thirdMix"]} min="0" max="1" step="0.01" />
                    </p>
                );
                pedCustomisation.push(
                    <h2>
                        Face features:
                    </h2>
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
                            {faceFeatures[faceFeature]}:&nbsp;
                            <input type="number" onChange={updatedFeature} value={this.state.selectedVariations.face[faceFeature]} min="-1" max="1" step="0.1" />
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
                        <input type="number" onChange={updateHairColor(0)} value={this.state.selectedVariations.hairColor[0]} min="0" max="63" />
                        <input type="number" onChange={updateHairColor(1)} value={this.state.selectedVariations.hairColor[1]} min="0" max="63" />
                    </p>
                );
                for (let overlayID = 0; overlayID < this.state.variations.headOverlay.length; overlayID++) {
                    let overlayIndexNumber = this.state.variations.headOverlay[overlayID];
                    let overlayHasColor = headOverlayWithColors.includes(overlayID);
                    let updateVariation = e => {
                        let newValue = parseInt(e.target.value);
                        this.state.selectedVariations.headOverlay[overlayID] = overlayHasColor ? [newValue, 1, 0, 0] : [newValue, 1];
                        this.setState({ selectedVariations: this.state.selectedVariations });
                        this.sendUpdatedVariations();
                    };
                    let updateOpacity = e => {
                        let newValue = parseFloat(e.target.value);
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
                            <b>{headOverlay[overlayID]}:</b>&nbsp;
                            {overlayIndexNumber} variations&nbsp;
                            <input type="number" onChange={updateVariation} value={this.state.selectedVariations.headOverlay[overlayID][0]} min="-1" max={overlayIndexNumber - 1} />&nbsp;
                            Opacity:&nbsp;
                            <input type="number" onChange={updateOpacity} value={this.state.selectedVariations.headOverlay[overlayID][1]} min="0" max="1" step="0.1" />&nbsp;
                            {overlayHasColor && <br />}
                            {overlayHasColor && "Main Color: "}
                            {overlayHasColor && <input type="number" onChange={updateColorOne} value={this.state.selectedVariations.headOverlay[overlayID][2]} min="0" max="63" />}
                            {overlayHasColor && " Secondary Color: "}
                            {overlayHasColor && <input type="number" onChange={updateColorTwo} value={this.state.selectedVariations.headOverlay[overlayID][3]} min="0" max="63" />}
                        </p>
                    )
                }
            }
            let rightMenu = [];
            if (this.state.mode === "new_character") {
                rightMenu.push(
                    <p>Name: <input onChange={e => this.onNameChange(e)}></input></p>,
                );
            }
            return (
                <div id="char-creation">
                    <div id="ped-selection">
                        <div className='ped-selection-header'>
                            <p>
                                Camera:
                                <div className='btn-group'>
                                    <button className={'btn btn-primary btn-lg' + (this.state.camera === "face" ? ' active' : '')} onClick={() => this.setCamera("face")}>Face</button>
                                    <button className={'btn btn-primary btn-lg' + (this.state.camera === "body" ? ' active' : '')} onClick={() => this.setCamera("body")}>Body</button>
                                    <button className={'btn btn-primary btn-lg' + (this.state.camera ? '' : ' active')} onClick={() => this.setCamera(null)}>Default</button>
                                </div>
                            </p>
                            <p>
                                Page:
                                <div className='btn-group'>
                                    <button className={'btn btn-primary btn-lg' + (this.state.clothingPage === "clothing" ? ' active' : '')} onClick={() => this.setState({ clothingPage: "clothing" })}>Clothing</button>
                                    <button className={'btn btn-primary btn-lg' + (this.state.clothingPage === "head" ? ' active' : '')} onClick={() => this.setState({ clothingPage: "head" })}>Head</button>
                                    <button className={'btn btn-primary btn-lg' + (this.state.clothingPage === "face" ? ' active' : '')} onClick={() => this.setState({ clothingPage: "face" })}>Face</button>
                                </div>
                            </p>
                        </div>
                        <div className='ped-selection-body'>
                            {pedCustomisation}
                        </div>
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
window.addEventListener("keydown", e => {
    if (e.code === "Escape") {
        selection.escapePressed();
    }
});
fetch(`https://${GetParentResourceName()}/ready`, {
    method: 'POST'
});
