/*global GetParentResourceName*/

import './index.css';
import './RadialMenu.css';
import { RadialMenu } from './RadialMenu.js';

console.log("listener set up");
const root = document.getElementById('root');
window.addEventListener('message', (event) => {
    console.log("on event", JSON.stringify(event.data));
    let data = event.data;
    if (data.action === 'show_f1' || data.action === "hide_f1") {
        root.innerHTML = "";
        var svgMenu = new RadialMenu({
            parent: root,
            size: 400,
            closeOnClick: true,
            menuItems: data.menuItems,
            onClick: function (item) {
                console.log('You have clicked:', JSON.stringify(item));
                fetch(`https://${GetParentResourceName()}/selectedItem`, {
                    method: 'POST',
                    body: JSON.stringify(item)
                });
            },
            onClose: function () {
                fetch(`https://${GetParentResourceName()}/close`, {
                    method: 'POST'
                });
            }
        });
        svgMenu.open();
    }
});
