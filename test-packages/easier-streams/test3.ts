import fs from 'fs'


async function getFileNamesInFolder(folderPath: string){
    let fileNames:string[] = [];
    try{
        fileNames = await fs.promises.readdir(folderPath)
    }
    catch (e) {
        console.log(`error getting file names from folder ${folderPath}: ${e}`);
        return [];
    }
    return fileNames;

}

async function getFilePathsInFolder(folderPath: string){
    return (await this.getFileNamesInFolder(folderPath)).map((fileName: string) => path.join(folderPath, fileName))
}

function checkFileExists(filePath: string){
    return fs.existsSync(filePath);
}

(() => {
    
})