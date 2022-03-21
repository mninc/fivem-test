let characterAttributes = {
    cash: -1,
};
const updateKeys = ["cash", "health", "walk"];
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
    emitNet("database:getCharacter", cid, "core:characterFromDatabase");
});

onNet("core:characterFromDatabase", character => {
    characterAttributes = {
        cid: character.cid,
        health: character.health,
        ped: character.ped,
        cash: character.cash,
        phoneNumber: character.phoneNumber,
    };
    loaded = true;
    emit("core:newAttributes", characterAttributes);
});

setTick(() => {
    if (finalDisable.attack) {
        DisableControlAction(0, 24, true);
        DisableControlAction(0, 25, true);
        DisableControlAction(0, 257, true);
    }
    if (finalDisable.look) {
        DisableControlAction(0, 1, true);
        DisableControlAction(0, 2, true);
        DisableControlAction(0, 4, true);
        DisableControlAction(0, 6, true);
        DisableControlAction(0, 270, true);
        DisableControlAction(0, 271, true);
        DisableControlAction(0, 272, true);
        DisableControlAction(0, 273, true);
    }
});

let finalDisable = {
    attack: false,
    look: false
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
        finalDisable[key] = value;
    }
}
