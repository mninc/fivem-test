import { CharacterAttributes } from '../../../types/dist';

let Delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let characterAttributes: CharacterAttributes = null;
on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    characterAttributes = newAttributes;
});

on("vehicle:rental-menu", () => {
    emit("context-menu:open-menu", [
        {
            title: "Vehicle Rental"
        },
        {
            title: "Bison",
            description: "$500",
            action: ["vehicle:rent-vehicle", "bison"]
        },
        {
            title: "Buffalo",
            description: "$1000",
            action: ["vehicle:rent-vehicle", "buffalo"]
        }
    ])
});
const vehicleCost = {
    bison: 500,
    buffalo: 1000
};

on("vehicle:rent-vehicle", (vehicle: string) => {
    let cost = vehicleCost[vehicle];
    if (cost > characterAttributes.cash) return console.log("not enough cash");

    emit("core:setAttributes", { cash: characterAttributes.cash - cost });
    emitNet("vehicle:create-rental-vehicle", { vehicle });
});

async function createPed() {
    const pedHash = "mp_m_waremech_01";

    RequestModel(pedHash);
    while (!HasModelLoaded(pedHash)) {
        await Delay(20);
    }

    const ped = CreatePed(0, pedHash, 110.7847, -1088.8030, 28.3025, 9.3301, false, false);
    FreezeEntityPosition(ped, true);
    SetEntityInvincible(ped, true);
    SetBlockingOfNonTemporaryEvents(ped, true);
    emit("peek:registerPeekablePed", ped, ["vehicle:rental-menu"]);
}
createPed();
