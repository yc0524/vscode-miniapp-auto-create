// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { generators, logger } = require('./utils/utils');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

// 注册命令
const commandList = [
  {
    type: 'page',
    commandID: 'extension.createMiniappPage',
  },
  {
    type: 'component',
    commandID: 'extension.createMiniappComponent',
  },
];

function createComponent(uri, type) {
  vscode.window
    .showInputBox({
      prompt: `Enter ${type} name`,
    })
    .then((val) => {
      if (!val.length) {
        logger('error', `${type} name can not be empty`);
        throw new Error(`${type} name can not be empty`);
      } else {
        generators.createPageOrComponent(uri, val, type);
      }
    });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  commandList.forEach((commander) => {
    const { type, commandID } = commander;
    let disposable = vscode.commands.registerCommand(
      commandID,
      (uri) => {
        createComponent(uri, type);
      }
    );
    context.subscriptions.push(disposable);
  });
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
