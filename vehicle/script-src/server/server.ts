onNet("vehicle:create-rental-vehicle", (data: any) => {
    const hash = GetHashKey(data.vehicle);
    CreateVehicle(hash, 117.5270, -1082.2634, 28.1923, 4.8292, true, false);
});
