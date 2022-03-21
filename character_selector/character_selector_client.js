let inSelection = false;
let id = 1;
let ready = false;
SetNuiFocusKeepInput(true);
setTick(() => {
    if (inSelection) SetPlayerInvisibleLocally(PlayerId());
});

async function getModel(hash) {
    RequestModel(hash);
    while (!HasModelLoaded(hash)) {
        await Delay(1);
    }
}
const characterPositions = [
    [
        -2196.55517578125, // x
        3303.576904296875, // y
        31.813819885253906, // z
        207.68743896484375 // heading
    ], [
        -2194.346435546875,
        3303.952880859375,
        31.81355667114258,
        182.13352966308594
    ], [
        -2193.1279296875,
        3303.76708984375,
        31.81337356567383,
        168.4816436767578
    ], [
        -2191.49853515625,
        3303.349853515625,
        31.81306076049805,
        159.40924072265625
    ], [
        -2189.70556640625,
        3302.494873046875,
        31.81269073486328,
        143.53250122070312
    ]
];
let spawnedPeds = [];

function deletePeds() {
    for (let i = 0; i < spawnedPeds.length; i++) {
        DeletePed(spawnedPeds[i]);
    }
    spawnedPeds = [];
}

let characters;
onNet('character_selector:characters', async (chars) => {
    characters = chars;
    deletePeds();

    for (let i = 0; i < characters.length && i < characterPositions.length; i++) {
        const character = characters[i];
        await getModel(character.ped);
        const position = characterPositions[i];
        const newPed = CreatePed(0, character.ped, position[0], position[1], position[2], position[3], false, false);
        SetPedDefaultComponentVariation(newPed);
        if (character.variations && character.variations.ped && character.variations.ped.length) {
            let newPedVariations = character.variations;
            for (let component = 0; component < 12; component++) {
                SetPedComponentVariation(
                    newPed,
                    component,
                    newPedVariations.ped[component][0],
                    newPedVariations.ped[component][1],
                    2
                );
            }
            let props = [0, 1, 2, 6, 7];
            for (let i = 0; i < props.length; i++) {
                let prop = props[i];
                if (newPedVariations.pedProp[i][0] === -1) {
                    ClearPedProp(newPed, prop);
                } else {
                    SetPedPropIndex(
                        newPed,
                        prop,
                        newPedVariations.pedProp[i][0],
                        newPedVariations.pedProp[i][1],
                        true
                    );
                }
            }
        }
        spawnedPeds.push(newPed);
        SetModelAsNoLongerNeeded(character.ped);
    }

    while (!ready) {
        await Delay(10);
    }
    SendNuiMessage(JSON.stringify({ action: "enable_screen", characters }));
    ShutdownLoadingScreenNui();
    SetNuiFocus(
        true, true
    );
});

function characterSelector() {
    emit("core:disableControlActions", "character_selector", { attack: false, look: false });
    emitNet('database:getCharacters', GetPlayerServerId(PlayerId()));
    exports.spawnmanager.spawnPlayer({
        x: -2193.1298828125,
        y: 3297.818603515625,
        z: 31.81256103515625,
        model: 'a_m_m_bevhills_01'
    }, async () => {
        const player = PlayerPedId();
        inSelection = true;
        SetPlayerControl(PlayerId(), false);
        DisableIdleCamera(true);
        FreezeEntityPosition(player, true);
        SetEntityInvincible(player, true);
        SetEntityCollision(player, false, false);
    });
}

on('onClientGameTypeStart', () => {
    exports.spawnmanager.setAutoSpawnCallback(() => {
        exports.spawnmanager.setAutoSpawn(false);
        characterSelector();
    });
});

RegisterCommand("switch", () => {
    characterSelector();
});

RegisterCommand("free", async () => {
    NetworkOverrideClockTime(6, 30, 00);
    deletePeds();
    const player = PlayerPedId();
    SetNuiFocus(
        false, false
    );
    SendNuiMessage(JSON.stringify({ action: "disable_screen" }));
    inSelection = false;
    SetPlayerControl(PlayerId(), true);

    FreezeEntityPosition(player, false);
    SetEntityInvincible(player, false);
    SetEntityCollision(player, true, true);
    FreezePedCameraRotation(player, false);
    await getModel("ex_office_citymodel_01");
    CreateObject("ex_office_citymodel_01", -2199.311767578125, 3343.322021484375, 48.78097152709961, 85.8018798828125, false, false);
});

RegisterNuiCallbackType('newCharacter')
on('__cfx_nui:newCharacter', async (data, cb) => {
    cb();
    deletePeds();
    const player = PlayerId();
    inSelection = false;
    StartPlayerTeleport(player, -2199.311767578125, 3343.322021484375, 48.78097152709961, 85.8018798828125, true, true, true);
    while (!UpdatePlayerTeleport(player)) {
        await Delay(1);
    }
    SetGameplayCamRelativeHeading(180);
    SetPlayerControl(PlayerId(), true);
    FreezeEntityPosition(player, false);
    emit("core:disableControlActions", "character_selector", { attack: true, look: true });
});

RegisterNuiCallbackType('newCharacterPed')
on('__cfx_nui:newCharacterPed', async (data, cb) => {
    const player = PlayerId();
    await getModel(data.ped);
    SetPlayerModel(player, data.ped);
    SetPedDefaultComponentVariation(player);
    SetModelAsNoLongerNeeded(data.ped);

    const ped = PlayerPedId();
    let variations = {
        ped: [],
        pedProp: []
    };
    for (let component = 0; component < 12; component++) {
        let numberOfVariations = GetNumberOfPedDrawableVariations(ped, component);
        let textures = [];
        for (let variation = 0; variation < numberOfVariations; variation++) {
            textures.push(GetNumberOfPedTextureVariations(ped, component, variation));
        }
        variations.ped.push(textures);
    }
    let props = [0, 1, 2, 6, 7];
    for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        let numberOfVariations = GetNumberOfPedPropDrawableVariations(ped, prop);
        let textures = [];
        for (let variation = 0; variation < numberOfVariations; variation++) {
            textures.push(GetNumberOfPedPropTextureVariations(ped, prop, variation));
        }
        variations.pedProp.push(textures);
    }
    cb(variations);

    StartPlayerTeleport(player, -2199.311767578125, 3343.322021484375, 48.78097152709961, 85.8018798828125, true, true, true);
    while (!UpdatePlayerTeleport(player)) {
        await Delay(1);
    }
    SetGameplayCamRelativeHeading(180);
});


let variations = null;
RegisterNuiCallbackType('updatedVariations');
on('__cfx_nui:updatedVariations', async (data, cb) => {
    cb();
    variations = data.variations;
    const ped = PlayerPedId();
    for (let component = 0; component < 12; component++) {
        SetPedComponentVariation(
            ped,
            component,
            variations.ped[component][0],
            variations.ped[component][1],
            2
        );
    }
    let props = [0, 1, 2, 6, 7];
    for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        if (variations.pedProp[i][0] === -1) {
            ClearPedProp(ped, prop);
        } else {
            SetPedPropIndex(
                ped,
                prop,
                variations.pedProp[i][0],
                variations.pedProp[i][1],
                true
            );
        }
    }
});

RegisterNuiCallbackType('ready');
on('__cfx_nui:ready', async (data, cb) => {
    cb();
    ready = true;
});

Delay = (ms) => new Promise(res => setTimeout(res, ms));


RegisterNuiCallbackType('finishNewCharacter')
on('__cfx_nui:finishNewCharacter', async (data, cb) => {
    cb();
    emitNet('database:createCharacter', {
        name: data.name,
        ped: data.ped,
        variations
    });
});

onNet('character_selector:finishedCreatingCharacter', () => {
    characterSelector();
});

RegisterNuiCallbackType('deleteCharacter')
on('__cfx_nui:deleteCharacter', async (data, cb) => {
    cb();
    emitNet('database:deleteCharacter', {
        character: data.character
    });
});

onNet('character_selector:deletedCharacter', () => {
    characterSelector();
});

let cid;
RegisterNuiCallbackType('selectedCharacter');
on('__cfx_nui:selectedCharacter', async (data, cb) => {
    cb();
    inSelection = false;
    deletePeds();
    SetNuiFocus(
        false, false
    );
    const player = PlayerId();
    if (!characters) return;
    let character = characters.find(char => char.cid === data.character);
    if (!character) return;
    cid = character.cid;
    emit("core:cid", cid);
    emitNet("database:characterSelected", cid);
    await getModel(character.ped);
    SetPlayerModel(player, character.ped);
    SetModelAsNoLongerNeeded(character.ped);

    const ped = PlayerPedId();
    SetPedDefaultComponentVariation(ped);
    if (character.variations && character.variations.ped && character.variations.ped.length) {
        console.log("doing variations");
        let newPedVariations = character.variations;
        for (let component = 0; component < 12; component++) {
            SetPedComponentVariation(
                ped,
                component,
                newPedVariations.ped[component][0],
                newPedVariations.ped[component][1],
                2
            );
        }
        let props = [0, 1, 2, 6, 7];
        for (let i = 0; i < props.length; i++) {
            let prop = props[i];
            if (newPedVariations.pedProp[i][0] === -1) {
                ClearPedProp(ped, prop);
            } else {
                SetPedPropIndex(
                    ped,
                    prop,
                    newPedVariations.pedProp[i][0],
                    newPedVariations.pedProp[i][1],
                    true
                );
            }
        }
    }

    StartPlayerTeleport(player, data.location.x, data.location.y, data.location.z, 0, true, true, true);
    SetPlayerControl(PlayerId(), true);
    FreezeEntityPosition(player, false);
    SetEntityInvincible(player, false);
    SetEntityCollision(player, true, true);
    FreezePedCameraRotation(player, false);
    SetEntityHealth(PlayerPedId(), character.health);
    if (character.walk) ExecuteCommand(`walk ${character.walk}`);
});

on('onResourceStart', resource => {
    if (resource === "core") {
        emit("core:cid", cid);
    }
});
