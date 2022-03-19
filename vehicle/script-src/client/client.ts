function setSeat(seat: number) {
    let ped = PlayerPedId();
    let vehicle = GetVehiclePedIsIn(ped, false);
    if (!vehicle) return console.log("no veh");

    SetPedIntoVehicle(
        ped,
        vehicle,
        seat
    );
}

RegisterCommand("seat", (_, args: [string]) => {
    if (!args[0]) return console.log("no seat");
    let seat = parseInt(args[0]);
    setSeat(seat);
}, false);


on('vehicle:openMenu', async () => {
    emit("core:disableControlActions", "vehicle", { attack: true, look: true });
    SetNuiFocusKeepInput(true);
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "vehicle_menu", display: true }));
});

RegisterNuiCallbackType('closeVehicleMenu');
on('__cfx_nui:closeVehicleMenu', (_: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    emit("core:disableControlActions", "vehicle", { attack: false, look: false });
    cb();
});

RegisterNuiCallbackType('setSeat');
on('__cfx_nui:setSeat', (data: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    cb();
    setSeat(data.seat);
});

RegisterNuiCallbackType('toggleEngine');
on('__cfx_nui:toggleEngine', (data: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    cb();
    let ped = PlayerPedId();
    let vehicle = GetVehiclePedIsIn(ped, false);
    if (!vehicle) return;
    let engineOn = GetIsVehicleEngineRunning(vehicle);
    SetVehicleEngineOn(
        vehicle,
        !engineOn,
        false,
        true
    );
});
