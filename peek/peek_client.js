on('onResourceStart', resource => {
    if (resource !== "peek") return;
    SetNuiFocusKeepInput(true);
});

let peekOpen = false;
const models = {
    atm: [-1364697528, 506770882, -870868698, -1126237515]
};
let searchModels = [];
for (let key in models) {
    searchModels = searchModels.concat(models[key]);
}
let updateIn = -1;

setTick(() => {
    if (peekOpen) {
        DisableControlAction(0, 24, true);
        DisableControlAction(0, 25, true);
        DisableControlAction(0, 257, true);

        // looking around
        DisableControlAction(0, 1, true);
        DisableControlAction(0, 2, true);
        DisableControlAction(0, 4, true);
        DisableControlAction(0, 6, true);
        DisableControlAction(0, 270, true);
        DisableControlAction(0, 271, true);
        DisableControlAction(0, 272, true);
        DisableControlAction(0, 273, true);

        if (updateIn === 0) {
            updateIn = 20;
            let data = { action: "peek", options: getOptions() };
            SendNuiMessage(JSON.stringify(data));
        } else {
            updateIn--;
        }
    }
});

RegisterKeyMapping('+peek', 'Peek', 'keyboard', 'LMENU');
RegisterCommand('+peek', async () => {
    SetCursorLocation(0.5, 0.5);
    updateIn = 20;
    let data = { action: "peek", options: getOptions() };

    peekOpen = true;
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify(data));
});
RegisterCommand('-peek', async () => {
    peekOpen = false;
    SetNuiFocus(
        false, false
    );
    SendNuiMessage(JSON.stringify({ action: "close_peek" }));
});

function getOptions() {
    const options = []
    let entity = getClosestEntity();
    if (entity) {
        let model = GetEntityModel(entity);
        if (models.atm.includes(model)) {
            options.push("atm");
        }
    }
    return options;
}

function getClosestEntity() {
    const pC = GetEntityCoords(PlayerPedId(), false);
    const closestEntity = {
        entity: null,
        distance: Number.MAX_SAFE_INTEGER,
    };
    function processEntity(entity) {
        const type = GetEntityType(entity);
        if (type === 0 || type === 1) return; // no 'no object' or peds. need to add vehicle
        const eC = GetEntityCoords(entity);
        const distance = Math.hypot(pC[0] - eC[0], pC[1] - eC[1], pC[2] - eC[2]);
        if (distance < 2 && distance < closestEntity.distance) {
            const hash = GetEntityModel(entity);
            if (searchModels.includes(hash)) {
                closestEntity.entity = entity;
                closestEntity.distance = distance;
            }
        }
    }
    const firstObject = FindFirstObject();
    processEntity(firstObject[1]);
    let nextObject = FindNextObject(firstObject[0]);
    while (nextObject[0]) {
        processEntity(nextObject[1]);
        nextObject = FindNextObject(firstObject[0]);
    }
    EndFindObject(firstObject[0]);
    return closestEntity.entity;
}

RegisterCommand("entitytest", () => {
    let e = getClosestEntity();
    console.log(e, GetEntityModel(e));
});

RegisterNuiCallbackType('selectedOption')
on('__cfx_nui:selectedOption', async (data, cb) => {
    cb();
    peekOpen = false;
    SetNuiFocus(
        false, false
    );
    if (data.option) {
        if (data.option === "atm") {
            console.log("atm");
            emit("bank:atm");
        }
    }
});
