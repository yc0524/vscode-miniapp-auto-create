const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

function logger(type, msg = '') {
  switch (type) {
    case 'success':
      vscode.window.setStatusBarMessage(
        `Success: ${msg}`,
        5000
      );
      break;
    case 'warning':
      vscode.window.showWarningMessage(`Warning: ${msg}`);
      break;
    case 'error':
      vscode.window.showErrorMessage(`Error: ${msg}`);
      break;
  }
}

// 是否是主包
function isMainPackage(dirName) {
  return dirName === 'pages';
}

module.exports = {
  logger,
  generators: {
    templatesDir: path.resolve(__dirname, '../templates'), // 模板目录
    getDir(uri) {
      let dir; // 目录
      if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
        // 是文件夹
        dir = uri.fsPath;
      } else if (uri) {
        // 不是文件夹 返回当前目录
        dir = path.dirname(uri.fsPath);
      } else {
        dir = vscode.workspace.workspaceFolders;
      }
      return dir;
    },
    // 创建文件
    createFile(file, data) {
      return new Promise((resolve) => {
        let output = fse.outputFile(file, data);
        resolve(output);
      });
    },
    createPageOrComponent(uri, name, type) {
      let dir = this.getDir(uri); // 目录
      const templatesDir = path.resolve(
        __dirname,
        '../templates'
      );
      const fileTypes = ['js', 'wxss', 'wxml', 'json'];
      fileTypes.forEach((fileType) => {
        // 模板数据
        const templateContent = fs
          .readFileSync(
            `${templatesDir}/${type}/${fileType}.template`
          )
          .toString();
        // 创建的文件名
        let filename = `${dir}/${name}.${fileType}`;
        this.createFile(filename, templateContent);
      });
      // 更新app.json
      if (type === 'page') {
        this.updateAppJSON(dir, name);
      }
    },
    // 创建page之后需要更新app.json
    async updateAppJSON(dir, name) {
      console.log('dir--->', dir, dir.split('\\'));
      const dirArr = dir.split('\\');
      const srcIndex = dirArr.findIndex(
        (item) => item === 'src'
      );
      const appPath = `${vscode.workspace.workspaceFolders[0].uri.fsPath}/src/app.json`;
      let res;
      try {
        res = await fse.readJSON(appPath);
      } catch (error) {
        logger('error', 'app.json文件读取错误，请检查');
        return;
      }

      const app = { ...res };
      const isMain = isMainPackage(dirArr[srcIndex + 1]);
      if (isMain) {
        // 主包
        app.pages.push(
          `${dirArr.slice(srcIndex + 1).join('/')}/${name}`
        );
      } else {
        // 分包
        const pack = app.subPackages.find(
          (item) => item.root === dirArr[srcIndex + 1]
        );
        if (!pack) {
          logger('error', 'app.json 无此分包, 请检查');
          return;
        }
        pack.pages.push(
          `${dirArr.slice(srcIndex + 2).join('/')}/${name}`
        );
      }

      try {
        await fse.writeJSON(appPath, app);
      } catch (error) {
        logger(
          'error',
          'app.json 写入失败，请检查文件路径'
        );
      }
    },
  },
};
