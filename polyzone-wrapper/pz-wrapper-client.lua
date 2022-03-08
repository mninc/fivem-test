for zoneName, zone in pairs(Zones) do
    zone:onPlayerInOut(function(isPointInside, point)
        if isPointInside then
            TriggerEvent("pz-wrapper:enter", zoneName)
        else
            TriggerEvent("pz-wrapper:exit", zoneName)
        end
    end)

end

AddEventHandler("pz-wrapper:registerBoostVehicle", function(vehicle, dropoff, emitTo)
    BoostDropoffs[dropoff]:onPointInOut(function() 
        return GetEntityCoords(vehicle)
    end, function(isPointInside, point) 
        TriggerEvent(emitTo, vehicle, dropoff, isPointInside)
    end)
end)
