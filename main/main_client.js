setTick(() => {
    const player = PlayerId();
    if (GetPlayerWantedLevel(player)) {
        SetPlayerWantedLevel(player, 0);
        SetPlayerWantedLevelNow();
    }
    HideHudAndRadarThisFrame();
    const ped = PlayerPedId();
    const vehicle = GetVehiclePedIsIn(ped);
    SetVehicleRadioEnabled(vehicle, false);
});

on('onResourceStart', resource => {
    if (resource !== "main") return;
    SetAudioFlag("PoliceScannerDisabled", true);
});

RegisterCommand("tp", async (source, args) => {
    const player = PlayerId();
    const ped = PlayerPedId();
    StartPlayerTeleport(player, parseFloat(args[0]), parseFloat(args[1]), parseFloat(args[2]), GetEntityHeading(ped), true, true, true);
})
