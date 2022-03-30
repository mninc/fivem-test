import { Coords } from '../../../types/dist';

onNet("vehicle:create-rental-vehicle", (data: any) => {
    const hash = GetHashKey(data.vehicle);
    CreateVehicle(hash, 117.5270, -1082.2634, 28.1923, 4.8292, true, false);
});

on("vehicle:bought-vehicle", (data: any) => {
    const hash = GetHashKey(data.model);
    let veh = CreateVehicle(hash, -45.1274, -1113.8997, 26.4358, 187.4153, true, false);
    setTimeout(() => {
        let plate = GetVehicleNumberPlateText(veh);
        emit("database:bought-vehicle-plate", { id: data.id, plate, netID: veh });
    }, 1000);
});

onNet("vehicle:retrieve-vehicle", (data: { vehicle: any, coordinates: Coords }) => {
    const hash = GetHashKey(data.vehicle.model);
    const veh = CreateVehicle(hash, ...data.coordinates, true, false);
    SetVehicleNumberPlateText(veh, data.vehicle.plate);
    emit("database:retrieved-vehicle", { id: data.vehicle._id, netID: veh });
});

onNet("vehicle:park-vehicle", (cid: number, vehicleNetID: number, garageID: number) => {
    console.log("emitting to db", cid, vehicleNetID, garageID);
    vehicleNetID = NetworkGetEntityFromNetworkId(vehicleNetID);
    console.log("emitting to fixed", cid, vehicleNetID, garageID);
    emit("database:park-vehicle", cid, vehicleNetID, garageID);
});
on("vehicle:park-vehicle-success", (vehicleNetID: number) => {
    console.log("deleting", vehicleNetID);
    DeleteEntity(vehicleNetID);
});
