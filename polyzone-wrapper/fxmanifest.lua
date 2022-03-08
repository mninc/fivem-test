fx_version 'cerulean'
game 'gta5'

author 'manic'
description 'polyzone-wrapper'
version '1.0.0'


dependencies {
    "PolyZone"
}

client_scripts {
    '@PolyZone/client.lua',
    '@PolyZone/BoxZone.lua',
    '@PolyZone/EntityZone.lua',
    '@PolyZone/CircleZone.lua',
    '@PolyZone/ComboZone.lua',
    'zones.lua',
    'pz-wrapper-client.lua'
}

server_scripts {
    '@PolyZone/client.lua',
    '@PolyZone/BoxZone.lua',
    '@PolyZone/EntityZone.lua',
    '@PolyZone/CircleZone.lua',
    '@PolyZone/ComboZone.lua',
    'zones.lua',
    'pz-wrapper-server.lua'
}
