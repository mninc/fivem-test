interface MenuItem {
    title: string,
    description?: string,
    chilren?: MenuItem[],
    action?: any[],
}

on("context-menu:open-menu", (menuItems: MenuItem[]) => {
    emit("core:disableControlActions", "context-menu", { attack: true, look: true });
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "open-menu", menuItems }));
});

RegisterNuiCallbackType('close');
on('__cfx_nui:close', (_: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    emit("core:disableControlActions", "context-menu", { attack: false, look: false });
    cb();
});

RegisterNuiCallbackType('action');
on('__cfx_nui:action', (action: any[], cb: Function) => {
    cb();
    emit(action.shift(), ...action);
});

RegisterNuiCallbackType('elementFocus')
on('__cfx_nui:elementFocus', (data, cb) => {
    cb();
    SetNuiFocusKeepInput(!data.focus);
});
SetNuiFocusKeepInput(true);
