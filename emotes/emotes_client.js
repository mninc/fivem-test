RegisterCommand("e", async (source, args) => {
    const ped = PlayerPedId();
    console.log(args);
    if (args[0] === "c") {
        ClearPedTasksImmediately(ped);
    } else {
        if (!HasAnimDictLoaded(args[0])) {
            RequestAnimDict(args[0]);
            await wait(100);
        }
        TaskPlayAnim(ped, args[0], args[1], 2, 2, 2000, 51 /* or 1 or 0 */, 0, false, false, false);
    }
});
