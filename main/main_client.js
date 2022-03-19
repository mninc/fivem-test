let currentRadarOn = true;
setTick(() => {
    // stop auto switch to main seat
    SetPedConfigFlag(
        PlayerPedId(),
        184,
        true
    );

    // disable weapon wheel
    BlockWeaponWheelThisFrame();
    DisableControlAction(0, 37, true);

    DisableControlAction(0, 199, true); // pause menu

    const player = PlayerId();
    if (GetPlayerWantedLevel(player)) {
        SetPlayerWantedLevel(player, 0);
        SetPlayerWantedLevelNow();
    }

    for (let i = 1; i < 23; i++) {
        HideHudComponentThisFrame(i);
    }

    const ped = PlayerPedId();
    const vehicle = GetVehiclePedIsIn(ped);
    let radarShouldShow = !!vehicle;
    if (vehicle) {
        if (!GetIsVehicleEngineRunning(vehicle)) {
            radarShouldShow = false;
        }
        SetVehicleRadioEnabled(vehicle, false);
    }
    if (radarShouldShow && !currentRadarOn) {
        DisplayRadar(true);
        currentRadarOn = true;
    } else if (!radarShouldShow && currentRadarOn) {
        DisplayRadar(false);
        currentRadarOn = false;
    }
});

SetAudioFlag("PoliceScannerDisabled", true);
DisplayRadar(false);
