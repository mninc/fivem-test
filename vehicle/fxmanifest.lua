fx_version 'cerulean'
game 'gta5'

author 'manic'
description 'vehicle'
version '1.0.0'

client_script {
    'dist/client/menu.js',
    'dist/client/ownership.js'
}
ui_page 'build/index.html'
file 'build/**'

server_script 'dist/server/server.js'
