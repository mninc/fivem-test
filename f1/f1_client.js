on('onResourceStart', resource => {
    if (resource !== "f1") return;
    SetNuiFocusKeepInput(true);
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
    emit("core:disableControlActions", "f1", { attack: true, look: true });
    SetCursorLocation(0.5, 0.5);
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "show_f1", menuItems }));
});

RegisterNuiCallbackType('selectedItem')
on('__cfx_nui:selectedItem', async (item, cb) => {
    cb();
    if (item.action.type === "walk") {
        ExecuteCommand(`walk ${item.action.value}`);
    } else if (item.action.type === "vehicle") {
        emit("vehicle:openMenu");
    }
});

RegisterNuiCallbackType('close')
on('__cfx_nui:close', async (item, cb) => {
    cb();
    emit("core:disableControlActions", "f1", { attack: false, look: false });
    SetNuiFocus(
        false, false
    );
});
