let characterAttributes = {
    cash: -1,
};
const updateKeys = [ "cash", "health" ];
let loaded = false;

on("core:setAttributes", async (updates, justLoaded) => {
    if (justLoaded) loaded = true;
    if (!loaded) return; // could lose some changes

    let databaseUpdates = {};
    for (let i = 0; i < updateKeys.length; i++) {
        let key = updateKeys[i];
        if (updates[key] !== undefined && updates[key] !== characterAttributes[key]) {
            databaseUpdates[key] = updates[key];
        }
    }
    
    if (Object.keys(databaseUpdates).length > 0) {
        emitNet("database:updateCharacter", characterAttributes["cid"], databaseUpdates);
    }
    
    for (let key in updates) {
        characterAttributes[key] = updates[key];
    }
    emit("core:newAttributes", characterAttributes);
});
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
