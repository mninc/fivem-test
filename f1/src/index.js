/*global GetParentResourceName*/

import './index.css';
import './RadialMenu.css';
import { RadialMenu } from './RadialMenu.js';

const root = document.getElementById('root');
window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'show_f1' || data.action === "hide_f1") {
        root.innerHTML = "";
        var svgMenu = new RadialMenu({
            parent: root,
            size: 400,
            closeOnClick: true,
            menuItems: data.menuItems,
            onClick: function (item) {
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
