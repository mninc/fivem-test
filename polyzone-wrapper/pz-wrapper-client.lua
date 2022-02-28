for zoneName, zone in pairs(Zones) do
    zone:onPlayerInOut(function(isPointInside, point)
        if isPointInside then
            TriggerEvent("pz-wrapper:enter", zoneName)
        else
            TriggerEvent("pz-wrapper:exit", zoneName)
        end
    end)

end
