import { Coords } from '../../../types/dist';

let currentTasks = [];
onNet("tasks:start-task", async (data) => {
    let source = global.source;
    if (data.task_type === "boost") {
        let vehicle: { coords: Coords, model: string, netID?: number, colours: { primary: number, secondary: number }, blipID: number } = {
            coords: [-112.0295, -888.3356, 28.5091, 166.9715],
            model: "adder",
            colours: {
                primary: 0,
                secondary: 64
            },
            blipID: Math.random()
        };
        const hash = GetHashKey(vehicle.model);
        vehicle.netID = CreateVehicle(hash, ...vehicle.coords, true, false);
        SetVehicleColours(vehicle.netID, vehicle.colours.primary, vehicle.colours.secondary);
        emitNet("map-icons:create-blip", source, {
            coords: vehicle.coords,
            shortRange: false,
            name: "Pick up car",
            route: false,
            radius: 20,
            colour: 8,
            alpha: 100,
            blipID: vehicle.blipID
        });
        emit("pz-wrapper:registerBoostVehicle", vehicle.netID, "legion", "tasks:boostVehicleEntered");

        emit("database:createTask", { cid: data.cid, task_type: "boost", vehicle }, "tasks:loaded-task");
        console.log("start boost");
    }
});

on("tasks:loaded-task", (task) => {
    if (!task) return;
    let localTask = currentTasks.find(t => t.data._id === task._id);
    if (!localTask) {
        localTask = {};
        if (task.task_type === "boost") {
            task.car_in_zone = false;
        }
        currentTasks.push(localTask);
    }
    localTask.data = task;
    localTask.updating = false;
    for (let i = 0; i < task.serverIds.length; i++) {
        let player = task.serverIds[i];
        console.log("emitting to", player);
        emitNet("tasks:loaded-task", player, task);
    }
});
emit("database:loadActiveTasks", "tasks:loaded-task");

setTick(() => {
    let remove = [];
    for (let i = 0; i < currentTasks.length; i++) {
        let task = currentTasks[i];

        if (task.updating) continue;
        if (task.data.complete || !task.data.in_progress) {
            remove.push(i);
            if (task.data.task_type === "boost") {
                for (let i = 0; i < task.data.serverIds.length; i++) {
                    let player = task.data.serverIds[i];
                    emitNet("map-icons:delete-blip", player, task.data.vehicle.blipID);
                }
            }
            continue;
        }

        if (task.data.task_type === "boost") {
            if (task.data.current_step === 0) { // find and steal vehicle
                let currentVehicle = GetVehiclePedIsIn(GetPlayerPed(task.data.serverIds[0]), false); // TODO: check if any player is in the vehicle
                if (currentVehicle === task.data.vehicle.netID) {
                    task.updating = true;
                    for (let i = 0; i < task.data.serverIds.length; i++) {
                        let player = task.data.serverIds[i];
                        emitNet("map-icons:create-blip", player, {
                            coords: [214.73, -939.75, 24.14],
                            sprite: 326,
                            shortRange: false,
                            name: "Drop off car",
                            route: true,
                            blipID: task.data.vehicle.blipID
                        });
                    }
                    emit("database:updateTask", { task: task.data._id, update: { current_step: 1 } }, "tasks:loaded-task");
                }
            } else if (task.data.current_step === 1) { // take car to drop off spot
                if (task.car_in_zone) {
                    task.updating = true;
                    emit("database:updateTask", { task: task.data._id, update: { current_step: 2 } }, "tasks:loaded-task");
                } else {
                    let currentVehicle = GetVehiclePedIsIn(GetPlayerPed(task.data.serverIds[0]), false);
                    if (currentVehicle !== task.data.vehicle.netID) { // if they got out the car
                        task.updating = true;
                        emit("database:updateTask", { task: task.data._id, update: { current_step: 0 } }, "tasks:loaded-task");
                    }
                }
            } else if (task.data.current_step === 2) {
                if (task.car_in_zone) {
                    let x1 = GetEntityCoords(GetPlayerPed(task.data.serverIds[0]), false);
                    let x2 = GetEntityCoords(task.data.vehicle.netID, false);
                    let distance = Math.sqrt(
                        (x1[0] - x2[0]) ** 2 +
                        (x1[1] - x2[1]) ** 2 +
                        (x1[2] - x2[2]) ** 2
                    );
                    //let distance = (<any>GetDistanceBetweenCoords)(...GetEntityCoords(GetPlayerPed(task.data.serverIds[0]), false), ...GetEntityCoords(task.vehicle, false), false);
                    if (distance > 20) {
                        task.updating = true;
                        for (let i = 0; i < task.data.serverIds.length; i++) {
                            let player = task.data.serverIds[i];
                            emitNet("map-icons:delete-blip", player, task.data.vehicle.blipID);
                        }
                        emit("database:updateTask", { task: task.data._id, update: { complete: true, in_progress: false } }, "tasks:loaded-task");
                        DeleteEntity(task.data.vehicle.netID);
                        for (let i = 0; i < task.data.serverIds.length; i++) {
                            let player = task.data.serverIds[i];
                            emitNet("tasks:boost-complete", player, 2000);
                        }
                    }
                } else {
                    task.updating = true;
                    emit("database:updateTask", { task: task.data._id, update: { current_step: 1 } }, "tasks:loaded-task");
                }
            }
        }
    }

    for (let i = 0; i < remove.length; i++) {
        currentTasks.splice(remove[i], 1);
    }
});


on("tasks:boostVehicleEntered", function (vehicle: number, zone: string, isPointInside: boolean) {
    let task = currentTasks.find(task => task.data.vehicle.netID === vehicle);
    if (!task) return;

    task.car_in_zone = isPointInside;
});
