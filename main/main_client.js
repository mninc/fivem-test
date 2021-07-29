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
