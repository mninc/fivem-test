let characterAttributes = {
    cash: -1,
};
const updateKeys = ["cash", "health", "walk", "outfits", "currentOutfit"];
let loaded = false;

async function setAttributes(updates, justLoaded) {
    if (justLoaded) loaded = true;
    if (!loaded) return; // could lose some changes

    let databaseUpdates = {};
    for (let i = 0; i < updateKeys.length; i++) {
        let key = updateKeys[i];
        let newValue = updates[key];
        if (newValue !== undefined && newValue !== characterAttributes[key]) {
            if (key === "health" && newValue > 200) {
                newValue = 200;
                updates[key] = newValue;
            }
            databaseUpdates[key] = newValue;
        }
    }

    if (Object.keys(databaseUpdates).length > 0) {
        emitNet("database:updateCharacter", characterAttributes["cid"], databaseUpdates);
    }

    for (let key in updates) {
        characterAttributes[key] = updates[key];
    }
    emit("core:newAttributes", characterAttributes);
}

on("core:setAttributes", setAttributes);
on('onResourceStart', resource => {
    if (resource !== "core") {
        emit("core:newAttributes", characterAttributes);
    }
});

on("core:cid", cid => {
    if (!cid) {
        characterAttributes = {
            cid: null
        };
        loaded = false;
        emit("core:newAttributes", characterAttributes);
        return;
    }
    emitNet("database:getCharacter", cid, "core:characterFromDatabase");
});

onNet("core:characterFromDatabase", character => {
    characterAttributes = {
        cid: character.cid,
        health: character.health,
        ped: character.ped,
        cash: character.cash,
        phoneNumber: character.phoneNumber,
        walk: character.walk,
        outfits: character.outfits,
        currentOutfit: character.currentOutfit,
        whitelists: character.whitelists,
        jobs: [],
    };
    loaded = true;
    emit("core:newAttributes", characterAttributes);
});

function DisableControlActions(...actions) {
    for (let i = 0; i < actions.length; i++) {
        DisableControlAction(0, actions[i], true);
    }
}
setTick(() => {
    if (finalDisable.attack) {
        DisableControlActions(24, 25, 257);
    }
    if (finalDisable.look) {
        DisableControlActions(1, 2, 4, 6, 270, 271, 272, 273);
    }
    if (finalDisable.escape) {
        DisableControlActions(200);
    }
    if (finalDisable.move) {
        DisableControlActions(30, 31, 32, 33, 34, 35, 266, 267, 268, 269);
    }
});

let finalDisable = {
    attack: false,
    look: false,
    escape: false,
    move: false,
}
let disablePerResource = {};
on("core:disableControlActions", (resource, disable) => {
    disablePerResource[resource] = disable;
    computeFinalDisable();
});
function computeFinalDisable() {
    for (let key in finalDisable) {
        let value = false;
        for (let resource in disablePerResource) {
            if (!disablePerResource.hasOwnProperty(resource)) continue;
            if (disablePerResource[resource][key]) value = true;
        }
        if (key === "escape") { // pause menu will still open if you're still holding it when we stop disabling it
            setTimeout(() => {
                finalDisable[key] = value;
            }, 1000);
        } else {
            finalDisable[key] = value;
        }
    }
}
