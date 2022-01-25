setTick(() => {
    const ped = PlayerPedId();
    const currentWeapon = GetCurrentPedWeapon(ped)[1];
    const showAmmo = GetPedAmmoTypeFromWeapon_2(ped, currentWeapon);
    const clip = GetAmmoInClip(ped, currentWeapon)[1];
    const attributes = {
        health: GetEntityHealth(PlayerPedId()),
        clipSize: showAmmo ? clip : -1,
        totalAmmo: showAmmo ? GetAmmoInPedWeapon(ped, currentWeapon) - clip : -1
    };
    SendNuiMessage(JSON.stringify({
        action: "visible", visible: true, attributes
    }));
});
