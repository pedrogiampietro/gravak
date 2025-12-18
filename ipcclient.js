"use strict";

require("./require");

if(require.main === module) {

  /*
   * Function require.main
   * Returns a file from the base data directory
   */

  const IPCHTTPAPI = requireModule("ipchttpapi");

  new IPCHTTPAPI().listen(CONFIG.IPC.PORT, CONFIG.IPC.HOST);

}
