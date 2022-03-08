AddEventHandler("pz-wrapper:registerBoostVehicle", function(vehicle, dropoff, emitTo)
    BoostDropoffs[dropoff]:onPointInOut(function() 
        return GetEntityCoords(vehicle)
    end, function(isPointInside, point) 
        TriggerEvent(emitTo, vehicle, dropoff, isPointInside)
    end)
end)
