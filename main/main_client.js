let currentRadarOn = true;
setTick(() => {
    const hud = false;

    BlockWeaponWheelThisFrame();

    DisableControlAction(0, 37, true)
    DisableControlAction(0, 199, true) 
    
    const player = PlayerId();
    if (GetPlayerWantedLevel(player)) {
        SetPlayerWantedLevel(player, 0);
        SetPlayerWantedLevelNow();
    }
    for (let i = 1; i < 23; i++) {
        if (hud) ShowHudComponentThisFrame(i);
        else HideHudComponentThisFrame(i);
    }
    if (hud) {
        DisplayRadar(true);
        return;
    }
    const ped = PlayerPedId();
    const vehicle = GetVehiclePedIsIn(ped);
    if (vehicle) {
        SetVehicleRadioEnabled(vehicle, false);
        if (!currentRadarOn) {
            DisplayRadar(true);
            currentRadarOn = true;
        }
    } else {
        if (currentRadarOn) {
            DisplayRadar(false);
            currentRadarOn = false;
        }
    }
});

on('onResourceStart', resource => {
    if (resource !== "main") return;
    SetAudioFlag("PoliceScannerDisabled", true);
    DisplayRadar(false);
});

RegisterCommand("tp", async (source, args) => {
    const player = PlayerId();
    const ped = PlayerPedId();
    StartPlayerTeleport(player, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), GetEntityHeading(ped), true, true, true);
});

RegisterCommand("coords", () => {
    console.log(GetEntityCoords(PlayerPedId()));
    console.log(GetEntityHeading(PlayerPedId()));
});

RegisterCommand("time", () => {
    console.log(GetClockHours());
    console.log(GetClockMinutes());
});

RegisterCommand("radar", async (source, args) => {
    DisplayRadar(args[0] === "on");
});

function wait(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}
RegisterCommand("mmap", async () => {
    const id = AddMinimapOverlay("minimap.gfx");
    console.log(id);
    let i = 0;
    while (true) {
        i++;
        await wait(100);
        if (HasMinimapOverlayLoaded(id)) {
            break;
        }
    }
    console.log("loaded", i);
    SetMinimapOverlayDisplay(id, 0, 0, 100.001, 100.001, 0.0);
});

RegisterCommand("mmap2", () => {
    SetMinimapOverlayDisplay(5);
});
