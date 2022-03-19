// https://docs.fivem.net/docs/game-references/blips/

import { Coords3 } from '../../types/dist';

interface Blip {
    blipID?: number,
    coords?: Coords3,
    radius?: number,
    sprite?: number,
    colour?: number,
    alpha?: number,
    name?: string,
    shortRange?: boolean,
    route?: boolean
}
const blips = {};
function createBlip(data: Blip) {
    if (!data.blipID) data.blipID = Math.random();
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
    if (data.name) {
        BeginTextCommandSetBlipName("STRING");
        AddTextComponentString(data.name);
        EndTextCommandSetBlipName(blip);
    }
    SetBlipRoute(blip, data.route);
    blips[data.blipID] = blip;
}
onNet("map-icons:create-blip", createBlip);

onNet("map-icons:delete-blip", blipID => {
    if (blips[blipID]) {
        RemoveBlip(blips[blipID]);
    }
});

for (let i = 0; i < global.staticBlips.length; i++) {
    createBlip(<Blip>global.staticBlips[i]);
}
