let currentTasks = [];
onNet("tasks:start-task", async (data) => {
    if (data.task_type === "boost") {
        let model = "adder";

        const hash = GetHashKey(model);

        const vehicle = CreateVehicle(hash, 198.2210, -924.6464, 29.6920, 44.5956, true, false);
        emit("pz-wrapper:registerBoostVehicle", vehicle, "legion", "tasks:boostVehicleEntered");

        emit("database:createTask", { cid: data.cid, task_type: "boost", vehicle }, "tasks:loaded-task");
        console.log("start boost");
    }
});

on("tasks:loaded-task", (task) => {
    console.log("task", task);
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
    //console.log(currentTasks.length);
    for (let i = 0; i < currentTasks.length; i++) {
        let task = currentTasks[i];

        if (task.updating) continue;
        if (task.data.complete || !task.data.in_progress) {
            remove.push(i);
            continue;
        }

        //console.log(task);
        if (task.data.task_type === "boost") {
            if (task.data.current_step === 0) { // find and steal vehicle
                let currentVehicle = GetVehiclePedIsIn(GetPlayerPed(task.data.serverIds[0]), false); // TODO: check if any player is in the vehicle
                if (currentVehicle === task.data.vehicle) {
                    task.updating = true;
                    emit("database:updateTask", { task: task.data._id, update: { current_step: 1 } }, "tasks:loaded-task");
                }
            } else if (task.data.current_step === 1) { // take car to drop off spot
                if (task.car_in_zone) {
                    task.updating = true;
                    emit("database:updateTask", { task: task.data._id, update: { current_step: 2 } }, "tasks:loaded-task");
                } else {
                    let currentVehicle = GetVehiclePedIsIn(GetPlayerPed(task.data.serverIds[0]), false);
                    if (currentVehicle !== task.data.vehicle) { // if they got out the car
                        task.updating = true;
                        emit("database:updateTask", { task: task.data._id, update: { current_step: 0 } }, "tasks:loaded-task");
                    }
                }
            } else if (task.data.current_step === 2) {
                if (task.car_in_zone) {
                    let x1 = GetEntityCoords(GetPlayerPed(task.data.serverIds[0]), false);
                    let x2 = GetEntityCoords(task.data.vehicle, false);
                    let distance = Math.sqrt(
                        (x1[0] - x2[0]) ** 2 +
                        (x1[1] - x2[1]) ** 2 +
                        (x1[2] - x2[2]) ** 2
                    );
                    //let distance = (<any>GetDistanceBetweenCoords)(...GetEntityCoords(GetPlayerPed(task.data.serverIds[0]), false), ...GetEntityCoords(task.vehicle, false), false);
                    if (distance > 20) {
                        task.updating = true;
                        emit("database:updateTask", { task: task.data._id, update: { complete: true, in_progress: false } }, "tasks:loaded-task");
                        DeleteEntity(task.data.vehicle);
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
    let task = currentTasks.find(task => task.data.vehicle === vehicle);
    if (!task) return;

    task.car_in_zone = isPointInside;
});
