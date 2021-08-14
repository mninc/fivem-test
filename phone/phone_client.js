RegisterKeyMapping('phone', 'Phone', 'keyboard', 'o');
RegisterCommand('phone', async () => {
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "enable_phone"}));
});

RegisterNuiCallbackType('nuiFocusOff')
on('__cfx_nui:nuiFocusOff', (data, cb) => {
    SetNuiFocus(
        false, false
    );
    cb();
});
