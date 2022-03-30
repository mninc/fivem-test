import { CharacterAttributes, Coords, Coords3 } from '../../../types/dist';

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

const vehicleRentCost = {
    bison: 500,
    buffalo: 1000
};

on("vehicle:rent-vehicle", async (vehicle: string) => {
    let cost = vehicleRentCost[vehicle];
    if (cost > characterAttributes.cash) return console.log("not enough cash");

    emit("core:setAttributes", { cash: characterAttributes.cash - cost });
    emitNet("vehicle:create-rental-vehicle", { vehicle });
});

on("vehicle:sale-menu", () => {
    emit("context-menu:open-menu", [
        {
            title: "Buy a Vehicle"
        }, {
            title: "Futo",
            description: "$20,000",
            action: ["vehicle:buy-vehicle", "futo"]
        }
    ])
});

const vehiclePurchaseCost = {
    futo: 20000
};

on("vehicle:buy-vehicle", (vehicle: string) => {
    let cost = vehiclePurchaseCost[vehicle];

    emitNet("database:buy-vehicle", { vehicle, cost, cid: characterAttributes.cid });
});

on("vehicle:retrieve-vehicle", (vehicle: any, garageCoordinates: Coords) => {
    emitNet("vehicle:retrieve-vehicle", { vehicle, coordinates: garageCoordinates });
})

async function createPed(model: string, coords: Coords, events: string[]) {
    RequestModel(model);
    while (!HasModelLoaded(model)) {
        await Delay(20);
    }

    const ped = CreatePed(0, model, ...coords, false, false);
    FreezeEntityPosition(ped, true);
    SetEntityInvincible(ped, true);
    SetBlockingOfNonTemporaryEvents(ped, true);
    emit("peek:registerPeekablePed", ped, events);
}
createPed("mp_m_waremech_01", [110.7847, -1088.8030, 28.3025, 9.3301], ["vehicle:rental-menu"]);
createPed("csb_car3guy1", [-40.2197, -1114.7673, 25.4377, 71.4206], ["vehicle:sale-menu"]);
