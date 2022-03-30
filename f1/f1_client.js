SetNuiFocusKeepInput(true);

let characterAttributes = {};
on("core:newAttributes", newAttributes => {
    characterAttributes = newAttributes;
});

RegisterKeyMapping('f1', 'F1', 'keyboard', 'F1');
RegisterCommand('f1', async () => {
    let walks = ['Alien', 'Armored', 'Arrogant', 'Brave', 'Casual', 'Casual2', 'Casual3', 'Casual4', 'Casual5', 'Casual6', 'Chichi', 'Confident', 'Cop', 'Cop2', 'Cop3', 'Default Female', 'Default Male', 'Drunk', 'Drunk2', 'Drunk3', 'Femme', 'Fire', 'Fire2', 'Fire3', 'Flee', 'Franklin', 'Gangster', 'Gangster2', 'Gangster3', 'Gangster4', 'Gangster5', 'Grooving', 'Guard', 'Handcuffs', 'Heels', 'Heels2', 'Hiking', 'Hipster', 'Hobo', 'Hurry', 'Janitor', 'Janitor2', 'Jog', 'Lemar', 'Lester', 'Lester2', 'Maneater', 'Michael', 'Money', 'Muscle', 'Posh', 'Posh2', 'Quick', 'Runner', 'Sad', 'Sassy', 'Sassy2', 'Scared', 'Sexy', 'Shady', 'Slow', 'Swagger', 'Tough', 'Tough2', 'Trash', 'Trash2', 'Trevor', 'Wide'];
    let walkItems = [];
    let appendTo = walkItems;
    for (let i = 0; i < walks.length; i++) {
        let walk = walks[i];
        if (appendTo.length >= 7) {
            let newAppend = [];
            appendTo.push({
                title: "More...",
                icon: "ellipsis-h",
                items: newAppend
            });
            appendTo = newAppend;
        }
        appendTo.push({
            action: {
                type: "walk",
                value: walk.toLowerCase()
            },
            icon: "walking",
            title: walk,
        });
    }
    const menuItems = [
        {
            title: "Walk Style",
            icon: "walking",
            items: walkItems
        }
    ];
    let vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
    if (vehicle) {
        menuItems.push({
            title: "Vehicle",
            icon: "car",
            action: {
                type: "vehicle"
            }
        });
    }
    let [inGarage, garageID, garageCoordinates] = await isEntityInGarage(PlayerPedId());
    if (inGarage) {
        menuItems.push({
            title: "Garage",
            icon: "warehouse",
            action: {
                type: "open_garage",
                garageID,
                garageCoordinates,
            }
        });
    }

    let entities = getClosestEntities();
    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i].entity;
        if (GetEntityType(entity) === 2) {
            let [inGarage, garageID] = await isEntityInGarage(entity);
            if (inGarage) {
                menuItems.push({
                    title: "Park Vehicle",
                    icon: "parking",
                    action: {
                        type: "park_vehicle",
                        vehicle: entity,
                        garageID,
                    }
                });
            }
        }
    }

    emit("core:disableControlActions", "f1", { attack: true, look: true });
    SetCursorLocation(0.5, 0.5);
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "show_f1", menuItems }));
});

let polyzoneCallbacks = {};
function isEntityInGarage(entity) {
    return new Promise(resolve => {
        let id = Math.random();
        polyzoneCallbacks[id] = resolve;
        emit("pz-wrapper:isEntityInsideGarage", entity, id);
    });
}
on("f1:polyzone", async (...args) => {
    let id = args.shift();
    let func = polyzoneCallbacks[id];
    if (func) {
        polyzoneCallbacks[id] = null;
        func(args);
    }
});

let action;
RegisterNuiCallbackType('selectedItem')
on('__cfx_nui:selectedItem', async (item, cb) => {
    cb();
    if (item.action.type === "walk") {
        ExecuteCommand(`walk ${item.action.value}`);
    } else if (item.action.type === "vehicle") {
        emit("vehicle:openMenu");
    } else if (item.action.type === "open_garage") {
        action = item.action;
        emitNet("database:load-vehicles", characterAttributes.cid, item.action.garageID);
    } else if (item.action.type === "park_vehicle") {
        emitNet("vehicle:park-vehicle", characterAttributes.cid, NetworkGetNetworkIdFromEntity(item.action.vehicle), item.action.garageID)
    }
});

onNet("f1:loaded-vehicles", vehicles => {
    let menuItems = [
        {
            title: "Retrieve Vehicle"
        }
    ];
    for (let i = 0; i < vehicles.length; i++) {
        let vehicle = vehicles[i];
        if (vehicle.netID === -1) {
            menuItems.push({
                title: vehicle.model,
                description: `${vehicle.plate} - STORED`,
                action: ["vehicle:retrieve-vehicle", vehicle, action.garageCoordinates]
            })
        } else {
            menuItems.push({
                title: vehicle.model,
                description: `${vehicle.plate} - OUT`
            })
        }
    }
    emit("context-menu:open-menu", menuItems);
});

RegisterNuiCallbackType('close')
on('__cfx_nui:close', async (item, cb) => {
    cb();
    emit("core:disableControlActions", "f1", { attack: false, look: false });
    SetNuiFocus(
        false, false
    );
});

function getClosestEntities() {
    const pC = GetEntityCoords(PlayerPedId(), false);
    const closestEntities = [];
    function processEntity(entity) {
        const eC = GetEntityCoords(entity);
        const distance = Math.hypot(pC[0] - eC[0], pC[1] - eC[1], pC[2] - eC[2]);
        if (distance < 2) {
            closestEntities.push({ entity });
        }
    }

    function process(FindFirst, FindNext, EndFind) {
        const first = FindFirst();
        processEntity(first[1]);
        let next = FindNext(first[0]);
        while (next[0]) {
            processEntity(next[1]);
            next = FindNext(first[0]);
        }
        EndFind(first[0]);
    }

    process(FindFirstVehicle, FindNextVehicle, EndFindVehicle);
    return closestEntities;
}
