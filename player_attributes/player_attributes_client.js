let characterAttributes;

setTick(() => {
    if (!characterAttributes) return;
    const changes = {};
    const ped = PlayerPedId();
    if (ped !== characterAttributes.ped) {
        changes["ped"] = ped;
    }
    const currentWeapon = GetCurrentPedWeapon(ped)[1];
    const showAmmo = GetPedAmmoTypeFromWeapon_2(ped, currentWeapon);
    const clip = GetAmmoInClip(ped, currentWeapon)[1];
    const health = GetEntityHealth(PlayerPedId());
    if (health !== characterAttributes.health) {
        changes["health"] = health;
    }
    const attributes = {
        health,
        clipSize: showAmmo ? clip : -1,
        totalAmmo: showAmmo ? GetAmmoInPedWeapon(ped, currentWeapon) - clip : -1,
        cash: characterAttributes.cash
    };
    SendNuiMessage(JSON.stringify({
        action: "visible", visible: true, attributes
    }));
    if (Object.keys(changes).length > 0) {
        emit("core:setAttributes", changes);
    }
});

on("core:newAttributes", newAttributes => {
    if (!characterAttributes) {
        characterAttributes = newAttributes;
        return;
    }

    if (newAttributes.cash !== characterAttributes.cash) {
        SendNuiMessage(JSON.stringify({
            action: "show_cash",
            change: newAttributes.cash - characterAttributes.cash
        }));
    }

    characterAttributes = newAttributes;
})

RegisterCommand("cash", () => {
    SendNuiMessage(JSON.stringify({
        action: "show_cash"
    }));
});
