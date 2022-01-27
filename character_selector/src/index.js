import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { PedModel } from './peds';
import { spawnLocations } from './spawn_locations';
import ReactModal from 'react-modal';

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

ReactModal.setAppElement('#root');

class CharacterSelection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            mode: "selection",
            selectedCharacter: 0,
            showDeleteModal: false,
        };
        this.characterCreation = {
            name: "",
            ped: "a_m_m_bevhills_01"
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
        this.characterCreation.ped = event.target.value;
        fetch(`https://${GetParentResourceName()}/newCharacterPed`, {
            method: 'POST',
            body: JSON.stringify({
                ped: event.target.value
            })
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
    }

    newCharacter() {
        this.setMode("new_character");
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
        } else if (this.state.mode === "new_character") {
            return (
                <div id="char-creation">
                    <div id="ped-selection">
                        <select onChange={e => this.onPedChange(e)}>
                            {Object.keys(PedModel).map(ped => <option value={ped} key={ped}>{ped}</option>)}
                        </select>
                    </div>
                    <div id="char-attributes">
                        <p>Name: <input onChange={e => this.onNameChange(e)}></input></p>
                        <button onClick={() => this.finishCreation()}>Create Character</button>
                    </div>
                </div>
            )
            // 153
            // 294
            // 1332
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
    console.log("on event", event.data);
    let data = event.data;
    if (data.action === 'enable_screen' || data.action === "disable_screen") {
        if (data.action === "enable_screen") {
            selection.setCharacters(event.data.characters);
        }
        selection.setVisible(data.action === "enable_screen");
    }
});
