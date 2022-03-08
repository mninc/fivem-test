import { CharacterAttributes } from '../../../types/dist';

let Delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let characterAttributes: CharacterAttributes = null;
on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    characterAttributes = newAttributes;
});


async function createPed(hash: string, x: number, y: number, z: number, h: number, ...eventNames: string[]) {
    RequestModel(hash);
    while (!HasModelLoaded(hash)) {
        await Delay(20);
    }

    const ped = CreatePed(0, hash, x, y, z, h, false, false);
    FreezeEntityPosition(ped, true);
    SetEntityInvincible(ped, true);
    SetBlockingOfNonTemporaryEvents(ped, true);
    emit("peek:registerPeekablePed", ped, eventNames.map(name => "tasks:" + name));
}
async function start() {
    await createPed("a_m_y_beachvesp_01", 193.3164, -922.2592, 29.6923, 150.8092, "start-boost", "collect-cash");
}
start();

let currentTask;
on("tasks:start-boost", async () => {
    emitNet("tasks:start-task", { cid: characterAttributes.cid, task_type: "boost" });
});

let cashToCollect = 0;
onNet("tasks:boost-complete", (cash: number) => {
    cashToCollect += cash;
});

on("tasks:collect-cash", () => {
    emit("core:setAttributes", { cash: characterAttributes.cash + cashToCollect });
    cashToCollect = 0;
});

onNet("tasks:loaded-task", task => {
    emit("phone:task", task);
    currentTask = task;
});
on('onResourceStart', resource => {
    if (resource === "phone") {
        if (currentTask) {
            emit("phone:task", currentTask);
        }
    }
});
