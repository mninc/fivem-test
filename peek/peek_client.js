SetNuiFocusKeepInput(true);

let peekOpen = false;
const models = {
    atm: [-1364697528, 506770882, -870868698, -1126237515]
};
let searchModels = [];
for (let key in models) {
    searchModels = searchModels.concat(models[key]);
}
let updateIn = -1;

const peekablePeds = {};

on("peek:registerPeekablePed", (entity, emitTo) => {
    peekablePeds[entity] = emitTo;
    console.log(peekablePeds);
});

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
    let entities = getClosestEntities();
    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i].entity;

        const type = GetEntityType(entity);

        if (type === 3) {
            const model = GetEntityModel(entity);
            if (models.atm.includes(model)) {
                options.push("atm");
            }
        } else if (type === 1) {
            if (peekablePeds[entity]) {
                console.log(peekablePeds[entity]);
                options.push(...peekablePeds[entity]);
            }
        }
    }
    console.log(options);
    return options;
}

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

    process(FindFirstObject, FindNextObject, EndFindObject);
    process(FindFirstPed, FindNextPed, EndFindPed);
    return closestEntities;
}

RegisterCommand("entitytest", () => {
    let e = getClosestEntities();
    console.log(e, e.map(f => GetEntityModel(f.entity)));
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
            emit("bank:atm"); // TODO: rework so the atm option is just called bank:atm
        } else if (data.option.includes(":")) {
            emit(data.option);
        }
    }
});
