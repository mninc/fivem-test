Zones = {}

Zones["legion-square-bank-robbery"] = BoxZone:Create(vector3(146.7, -1045.11, 29.38), 2, 2, {
    name = "legion-square-bank-robbery",
    heading = 340,
    -- debugPoly=true,
    minZ = 28.38,
    maxZ = 32.38
});

BoostDropoffs = {}

BoostDropoffs["legion"] = BoxZone:Create(vector3(214.73, -939.75, 24.14), 8.6, 20.6, {
    name = "legion",
    heading = 55,
    -- debugPoly=true,
    minZ = 23.14,
    maxZ = 27.14
});

Garages = {}

Garages["garage-1-1"] = {
    garage = 1,
    zone = BoxZone:Create(vector3(50.92, -893.19, 30.25), 6.4, 4.2, {
        name = "garage-1-1",
        heading = 340,
        -- debugPoly=true,
        minZ = 29.25,
        maxZ = 33.25
    })
}
Garages["garage-1-2"] = {
    garage = 1,
    zone = BoxZone:Create(vector3(47.49, -891.93, 30.21), 6.4, 4.2, {
        name = "garage-1-2",
        heading = 340,
        -- debugPoly=true,
        minZ = 29.21,
        maxZ = 33.21
    })
}

Garages["garage-2-1"] = {
    garage = 2,
    zone = BoxZone:Create(vector3(106.03, -1063.0, 29.19), 6.4, 4.2, {
        name = "garage-2-1",
        heading = 65,
        -- debugPoly=true,
        minZ = 28.19,
        maxZ = 32.19
    })
}
