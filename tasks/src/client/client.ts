import { CharacterAttributes } from '../../../types/dist';

let Delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let characterAttributes: CharacterAttributes = null;
on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    characterAttributes = newAttributes;
});


async function createPed(hash: string, x: number, y: number, z: number, h: number, eventName: string) {
    RequestModel(hash);
    while (!HasModelLoaded(hash)) {
        await Delay(20);
    }

    const ped = CreatePed(0, hash, x, y, z, h, false, false);
    FreezeEntityPosition(ped, true);
    SetEntityInvincible(ped, true);
    SetBlockingOfNonTemporaryEvents(ped, true);
    emit("peek:registerPeekablePed", ped, "tasks:" + eventName);
}
async function start() {
    await createPed("a_m_y_beachvesp_01", 193.3164, -922.2592, 29.6923, 150.8092, "start-boost");
}
start();

let currentTask;
let carInZone = false;
on("tasks:start-boost", async () => {
    let model = "adder";

    const hash = GetHashKey(model);

    // Request the model and wait until the game has loaded it
    RequestModel(hash);
    while (!HasModelLoaded(hash)) {
        await Delay(10);
    }


    // Create a vehicle at the player's position
    const vehicle = CreateVehicle(hash, 198.2210, -924.6464, 29.6920, 44.5956, true, false);
    emit("pz-wrapper:registerBoostVehicle", vehicle, "legion", "tasks:boostVehicleEntered");
    carInZone = false;

    // Allow the game engine to clean up the vehicle and model if needed
    SetEntityAsNoLongerNeeded(vehicle);
    SetModelAsNoLongerNeeded(model);
    emitNet("database:createTask", GetPlayerServerId(PlayerId()), { cid: characterAttributes.cid, task_type: "boost", vehicle }, "tasks:loaded-task");
    console.log("start boost");
});

on("tasks:boostVehicleEntered", function (vehicle: number, zone: string, isPointInside: boolean) {
    if (!currentTask || currentTask.vehicle !== vehicle) return;

    carInZone = isPointInside;
});

let updatingTask = false;
onNet("tasks:loaded-task", task => {
    emit("phone:task", task);
    currentTask = task;
    updatingTask = false;
});

setTick(() => {
    if (!currentTask || updatingTask || currentTask.complete) return;

    if (currentTask.task_type === "boost") {
        if (currentTask.current_step === 0) { // find and steal vehicle
            let currentVehicle = GetVehiclePedIsIn(PlayerPedId(), false);
            if (currentVehicle === currentTask.vehicle) {
                updatingTask = true;
                emitNet("database:updateTask", GetPlayerServerId(PlayerId()), { task: currentTask._id, update: { current_step: 1 } }, "tasks:loaded-task");
            }
        } else if (currentTask.current_step === 1) { // take car to drop off spot
            if (carInZone) {
                updatingTask = true;
                emitNet("database:updateTask", GetPlayerServerId(PlayerId()), { task: currentTask._id, update: { current_step: 2 } }, "tasks:loaded-task");
            } else {
                let currentVehicle = GetVehiclePedIsIn(PlayerPedId(), false);
                if (currentVehicle !== currentTask.vehicle) { // if they got out the car
                    updatingTask = true;
                    emitNet("database:updateTask", GetPlayerServerId(PlayerId()), { task: currentTask._id, update: { current_step: 0 } }, "tasks:loaded-task");
                }
            }
        } else if (currentTask.current_step === 2) {
            if (carInZone) {
                let distance = (<any>GetDistanceBetweenCoords)(...GetEntityCoords(PlayerPedId(), false), ...GetEntityCoords(currentTask.vehicle, false), false);
                if (distance > 20) {
                    updatingTask = true;
                    emitNet("database:updateTask", GetPlayerServerId(PlayerId()), { task: currentTask._id, update: { complete: true, in_progress: false } }, "tasks:loaded-task");
                    DeleteEntity(currentTask.vehicle);
                    emit("core:setAttributes", { cash: characterAttributes.cash + 2000 });
                }
            } else {
                updatingTask = true;
                emitNet("database:updateTask", GetPlayerServerId(PlayerId()), { task: currentTask._id, update: { current_step: 1 } }, "tasks:loaded-task");
            }
        }
    }
});

