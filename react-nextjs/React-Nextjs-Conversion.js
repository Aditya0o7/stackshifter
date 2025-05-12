import copyPublicAssets from "./publicFolderMigration.js";


console.log("Copying public assets from React to Next.js...");
if(copyPublicAssets()){
    console.log("copyPublicAssets() completed successfully.");
}
else{
    console.log("xxxxxxxxxxxxxxxxxxxxx copyPublicAssets() failed.xxxxxxxxxxxxxxxxxxxxxx");
}
