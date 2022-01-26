on('onResourceStart', resource => {
    if (resource !== "f1") return;
    SetNuiFocusKeepInput(true);
});

let f1Open = false;

setTick(() => {
    if (f1Open) {
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
    }
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
    f1Open = true;
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
    }
});

RegisterNuiCallbackType('close')
on('__cfx_nui:close', async (item, cb) => {
    cb();
    f1Open = false;
    SetNuiFocus(
        false, false
    );
});
