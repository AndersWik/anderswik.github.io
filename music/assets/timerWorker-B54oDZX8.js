(function(){"use strict";let t;self.onmessage=e=>{clearInterval(t),e.data.type==="start"&&(t=setInterval(()=>self.postMessage("tick"),e.data.interval))}})();
