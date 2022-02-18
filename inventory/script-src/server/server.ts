onNet("inventory:NetworkGetNetworkIdFromEntity", async (source, entity) => {
    console.log("responding");
    emitNet("inventory:NetworkGetNetworkIdFromEntityResponse", source, NetworkGetNetworkIdFromEntity(entity));
})

on("entityCreated", handle => {
    //console.log(handle);
})