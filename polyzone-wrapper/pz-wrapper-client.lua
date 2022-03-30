for zoneName, zone in pairs(Zones) do
    zone:onPlayerInOut(function(isPointInside, point)
        if isPointInside then
            TriggerEvent("pz-wrapper:enter", zoneName)
        else
            TriggerEvent("pz-wrapper:exit", zoneName)
        end
    end)
end

local lastGarage = 0
for zoneName, zone in pairs(Garages) do
    if lastGarage == zone.garage then
        goto continue
    end
    lastGarage = zone.garage
    TriggerEvent("map-icons:create-blip", {
        coords = {zone.zone.center.x, zone.zone.center.y, zone.zone.center.z},
        sprite = 357,
        shortRange = true,
        name = "Garage " .. zone.garage
    })
    ::continue::
end

AddEventHandler("pz-wrapper:registerBoostVehicle", function(vehicle, dropoff, emitTo)
    BoostDropoffs[dropoff]:onPointInOut(function()
        return GetEntityCoords(vehicle)
    end, function(isPointInside, point)
        TriggerEvent(emitTo, vehicle, dropoff, isPointInside)
    end)
end)

AddEventHandler("pz-wrapper:isEntityInsideGarage", function(vehicle, callbackID)
    local entityCoords = GetEntityCoords(vehicle)
    for zoneName, zone in pairs(Garages) do
        local inGarage = zone.zone:isPointInside(entityCoords)
        if inGarage then
            TriggerEvent("f1:polyzone", callbackID, true, zone.garage, {zone.zone.center.x, zone.zone.center.y, zone.zone.center.z, zone.zone.offsetRot})
            return
        end
    end
    TriggerEvent("f1:polyzone", callbackID, false, 0)
end)
