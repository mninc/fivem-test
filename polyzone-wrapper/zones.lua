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
