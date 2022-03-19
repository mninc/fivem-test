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



let vehicleMenuOpen = false;
on('vehicle:openMenu', async () => {
    /*if (vehicleMenuOpen) {
        vehicleMenuOpen = false;
        SetNuiFocus(
            false, false
        );
        SendNuiMessage(JSON.stringify({ action: "vehicle_menu", display: false }));
    } else {*/
    vehicleMenuOpen = true;
    SetNuiFocusKeepInput(true);
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "vehicle_menu", display: true }));
    //}
});

setTick(() => {
    SetPedConfigFlag(
        PlayerPedId(), 
        184, 
        true
    );
    if (vehicleMenuOpen) {
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

RegisterNuiCallbackType('closeVehicleMenu');
on('__cfx_nui:closeVehicleMenu', (_: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    vehicleMenuOpen = false;
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
