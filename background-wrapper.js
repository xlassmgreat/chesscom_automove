browser.runtime.onConnect.addListener((cport) => {
  let nport = browser.runtime.connectNative("eeing");
  
  cport.onMessage.addListener((msg) => {
    nport.postMessage(msg);
  })

  nport.onMessage.addListener((msg) => {
    cport.postMessage(msg);
  })

  nport.onDisconnect.addListener((p) => {
    cport.disconnect();
    console.log("Eeing disconnected.");
  })

  cport.onDisconnect.addListener((p) => {
    nport.disconnect();
    console.log("Content script disconnected");
  })
})
