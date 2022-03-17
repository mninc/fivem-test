// https://docs.fivem.net/docs/game-references/blips/

const blips = {};
onNet("map-icons:create-blip", data => {
    if (blips[data.blipID]) {
        RemoveBlip(blips[data.blipID]);
    }
    let blip;
    if (data.radius) {
        blip = AddBlipForRadius(...data.coords, data.radius);
    } else {
        blip = AddBlipForCoord(...data.coords);
    }
    if (data.sprite) SetBlipSprite(blip, data.sprite);
    if (data.colour) SetBlipColour(blip, data.colour);
    if (data.alpha) SetBlipAlpha(blip, data.alpha);
    SetBlipAsShortRange(blip, data.shortRange);
    BeginTextCommandSetBlipName("STRING");
    AddTextComponentString(data.name);
    EndTextCommandSetBlipName(blip);
    SetBlipRoute(blip, data.route);
    blips[data.blipID] = blip;
});

onNet("map-icons:delete-blip", blipID => {
    if (blips[blipID]) {
        RemoveBlip(blips[blipID]);
    }
});
