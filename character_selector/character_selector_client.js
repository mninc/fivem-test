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

async function setPedOutfit(ped, outfit) {
    if (!outfit) return;

    // if it's not the player, assume the ped is correct since to update we need to create a new ped
    if (ped === PlayerPedId() && !IsPedModel(ped, outfit.pedModel)) {
        await getModel(outfit.pedModel);
        SetPlayerModel(PlayerId(), outfit.pedModel);
        SetModelAsNoLongerNeeded(outfit.pedModel);
        ped = PlayerPedId();
    }

    for (let component = 0; component < 12; component++) {
        SetPedComponentVariation(
            ped,
            component,
            outfit.ped[component][0],
            outfit.ped[component][1],
            2
        );
    }
    let props = [0, 1, 2, 6, 7];
    for (let i = 0; i < props.length; i++) {
        let prop = props[i];
        if (outfit.pedProp[i][0] === -1) {
            ClearPedProp(ped, prop);
        } else {
            SetPedPropIndex(
                ped,
                prop,
                outfit.pedProp[i][0],
                outfit.pedProp[i][1],
                true
            );
        }
    }
}

let characters;
onNet('character_selector:characters', async (chars) => {
    characters = chars;
    deletePeds();

    for (let i = 0; i < characters.length && i < characterPositions.length; i++) {
        const character = characters[i];
        const outfit = character.currentOutfit;
        await getModel(outfit.pedModel);
        const position = characterPositions[i];
        const newPed = CreatePed(0, outfit.pedModel, position[0], position[1], position[2], position[3], false, false);
        SetModelAsNoLongerNeeded(outfit.pedModel);
        await setPedOutfit(newPed, outfit);
        spawnedPeds.push(newPed);
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

let cid;
function characterSelector() {
    cid = null;
    emit("core:cid", cid);
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

function loadVariationsNumbers(ped) {
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
    return variations;
}
async function newCharacterPed(pedModel, cb) {
    const player = PlayerId();
    await getModel(pedModel);
    SetPlayerModel(player, pedModel);
    SetModelAsNoLongerNeeded(pedModel);

    cb(loadVariationsNumbers(PlayerPedId()));

    if (!inClothingMenu) {
        StartPlayerTeleport(player, -2199.311767578125, 3343.322021484375, 48.78097152709961, 85.8018798828125, true, true, true);
        while (!UpdatePlayerTeleport(player)) {
            await Delay(1);
        }
    }
    SetGameplayCamRelativeHeading(180);
}


let variations = {};
let inClothingMenu = false;
RegisterNuiCallbackType('updatedVariations');
on('__cfx_nui:updatedVariations', async (data, cb) => {
    if (!data.variations.ped) { // indicates it's a ped switch
        await newCharacterPed(data.variations.pedModel, cb);
        variations = data.variations;
        return;
    } else {
        cb();
    }
    variations = data.variations;
    await setPedOutfit(PlayerPedId(), variations);
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
        outfit: variations
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
    await setPedOutfit(PlayerPedId(), character.currentOutfit);

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

let characterAttributes = null;
on("core:newAttributes", (newAttributes) => {
    characterAttributes = newAttributes;
});

RegisterCommand("outfits", () => {
    if (!characterAttributes) return;

    let outfits = characterAttributes.outfits;
    let menuItems = [];
    for (let i = 0; i < outfits.length; i++) {
        let outfit = outfits[i];
        menuItems.push({
            title: `${i} | ${outfit.outfitName}`,
            children: [
                {
                    title: "Use Outfit",
                    action: ["character_selector:use-outfit", i]
                },
                {
                    title: "Delete Outfit",
                    action: ["character_selector:delete-outfit", i]
                }
            ]
        });
    }
    emit("context-menu:open-menu", [
        {
            title: "Outfits"
        },
        ...menuItems,
        {
            title: "Save current outfit",
            textInput: "Outfit Name",
            action: ["character_selector:save-outfit"]
        }
    ]);
});

function deleteOutfit(outfitIndex) {
    if (!characterAttributes.outfits[outfitIndex]) return console.log("invalid outfit");

    characterAttributes.outfits.splice(outfitIndex, 1);
    emit("core:setAttributes", { outfits: characterAttributes.outfits });
}
on("character_selector:delete-outfit", deleteOutfit);
RegisterCommand("outfitdel", (source, args) => {
    deleteOutfit(parseInt(args[0]));
});

async function useOutfit(outfitIndex) {
    if (!characterAttributes.outfits[outfitIndex]) return console.log("invalid outfit");
    await setPedOutfit(PlayerPedId(), characterAttributes.outfits[outfitIndex]);

    emit("core:setAttributes", { currentOutfit: characterAttributes.outfits[outfitIndex] });
}
on("character_selector:use-outfit", useOutfit);
RegisterCommand("outfituse", async (source, args) => {
    useOutfit(parseInt(args[0]));
});

function saveOutfit(name) {
    if (!name) return console.log("set a name");

    characterAttributes.currentOutfit.outfitName = name;
    characterAttributes.outfits.push(characterAttributes.currentOutfit);
    emit("core:setAttributes", { outfits: characterAttributes.outfits });
}
on("character_selector:save-outfit", saveOutfit);
RegisterCommand("outfitsave", (source, args) => {
    saveOutfit(args[0]);
});

RegisterCommand("clothing", () => {
    SendNuiMessage(JSON.stringify({ action: "clothing", selectedVariations: characterAttributes.currentOutfit, variations: loadVariationsNumbers(PlayerPedId()) }));
    SetNuiFocus(
        true, true
    );
    emit("core:disableControlActions", "character_selector", { attack: true, look: true });
    inClothingMenu = true;
});

RegisterNuiCallbackType('saveClothing')
on('__cfx_nui:saveClothing', async (data, cb) => {
    cb();
    SetNuiFocus(
        false, false
    );
    emit("core:disableControlActions", "character_selector", { attack: false, look: false });
    emit("core:setAttributes", { currentOutfit: variations });
    inClothingMenu = false;
});

RegisterNuiCallbackType('cancelClothing')
on('__cfx_nui:cancelClothing', async (data, cb) => {
    cb();
    SetNuiFocus(
        false, false
    );
    emit("core:disableControlActions", "character_selector", { attack: false, look: false });
    await setPedOutfit(PlayerPedId(), characterAttributes.currentOutfit);
    inClothingMenu = false;
});
