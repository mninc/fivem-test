let inSelection = false;
let id = 1;
let ready = false;
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
        32.813819885253906, // z
        207.68743896484375 // heading
    ], [
        -2194.346435546875,
        3303.952880859375,
        32.81355667114258,
        182.13352966308594
    ], [
        -2193.1279296875,
        3303.76708984375,
        32.81337356567383,
        168.4816436767578
    ], [
        -2191.49853515625,
        3303.349853515625,
        32.81306076049805,
        159.40924072265625
    ], [
        -2189.70556640625,
        3302.494873046875,
        32.81269073486328,
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
    exports.spawnmanager.setAutoSpawnCallback(characterSelector);
    exports.spawnmanager.setAutoSpawn(false);
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
});

RegisterNuiCallbackType('newCharacterPed')
on('__cfx_nui:newCharacterPed', async (data, cb) => {
    cb();
    const player = PlayerId();
    await getModel(data.ped);
    SetPlayerModel(player, data.ped);
    SetPedDefaultComponentVariation(player);
    SetModelAsNoLongerNeeded(data.ped);
    StartPlayerTeleport(player, -2199.311767578125, 3343.322021484375, 48.78097152709961, 85.8018798828125, true, true, true);
    while (!UpdatePlayerTeleport(player)) {
        await Delay(1);
    }
    SetGameplayCamRelativeHeading(180);
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
    emitNet('database:createCharacter', GetPlayerServerId(PlayerId()), {
        name: data.name,
        ped: data.ped
    });
});

onNet('character_selector:finishedCreatingCharacter', () => {
    characterSelector();
});

RegisterNuiCallbackType('deleteCharacter')
on('__cfx_nui:deleteCharacter', async (data, cb) => {
    cb();
    emitNet('database:deleteCharacter', GetPlayerServerId(PlayerId()), {
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
    await getModel(character.ped);
    SetPlayerModel(player, character.ped);
    SetPedDefaultComponentVariation(player);
    SetModelAsNoLongerNeeded(character.ped);
    StartPlayerTeleport(player, data.location.x, data.location.y, data.location.z, 0, true, true, true);
    SetPlayerControl(PlayerId(), true);
    FreezeEntityPosition(player, false);
    SetEntityInvincible(player, false);
    SetEntityCollision(player, true, true);
    FreezePedCameraRotation(player, false);
    SetEntityHealth(PlayerPedId(), character.health);
});

on('onResourceStart', resource => {
    if (resource === "core") {
        emit("core:cid", cid);
    }
});
