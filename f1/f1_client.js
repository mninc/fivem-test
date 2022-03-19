on('onResourceStart', resource => {
    if (resource !== "f1") return;
    SetNuiFocusKeepInput(true);
});

RegisterKeyMapping('f1', 'F1', 'keyboard', 'F1');
RegisterCommand('f1', async () => {
    const menuItems = [
        {
            title: "Walk Style",
            icon: "walking",
            items: [
                {
                    title: "Wide",
                    action: {
                        type: "walk",
                        value: "wide"
                    },
                    icon: "arrows-alt-h"
                }, {
                    title: "Cop",
                    action: {
                        type: "walk",
                        value: "cop"
                    },
                    icon: "baseball-ball"
                }, {
                    title: "Drunk",
                    action: {
                        type: "walk",
                        value: "drunk3"
                    },
                    icon: "beer"
                }
            ]
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
