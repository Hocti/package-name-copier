// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { setTimeout } from 'timers';

function getPackageName(packageJsonPath: string){
	if (fs.existsSync(packageJsonPath)) {
		try {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			return packageJson.name;
		} catch (error) {
			vscode.window.showErrorMessage(`Error reading package.json: ${error}`);
			return undefined;
		}
	}
	return undefined;
}

function findNearestPackageJson(filePath: string): string | undefined {
	let currentDir = filePath;

	// Check if the input path is a directory and contains package.json
	if (fs.lstatSync(filePath).isDirectory()) {
		const packageJsonPath = path.join(filePath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			const name=getPackageName(packageJsonPath);
			if(name){
				return name;
			}
		}
		currentDir = path.dirname(filePath);
	}

	while (currentDir !== path.parse(currentDir).root) {
		/*
		if (vscode.workspace.workspaceFolders) {
			const isInsideWorkspace = vscode.workspace.workspaceFolders.some(folder => currentDir.startsWith(folder.uri.fsPath));
			const isWorkspaceRoot = vscode.workspace.workspaceFolders.some(folder => folder.uri.fsPath === currentDir);
			if (isWorkspaceRoot || !isInsideWorkspace) {
				return undefined;
			}
		}
			*/
		const packageJsonPath = path.join(currentDir, 'package.json');
		const name=getPackageName(packageJsonPath);
		if(name){
			return name;
		}
		if(vscode.workspace.workspaceFolders?.some((folder: vscode.WorkspaceFolder) => folder.uri.fsPath === currentDir)){
			break;
		}
		currentDir = path.dirname(currentDir);
	}
	return undefined;
}

export function activate(context: vscode.ExtensionContext) {

	let disposable2 = vscode.commands.registerCommand('package-name-copier.copyPackageName', (uri?: vscode.Uri) => {
		//console.log('Command "package-name-copier.copyPackageName" executed');
		let filePath: string;

		// If command is triggered from explorer context menu
		if (uri && uri.fsPath) {
			filePath = uri.fsPath;
		}
		// If command is triggered from editor tab context menu
		else if (vscode.window.activeTextEditor) {
			filePath = vscode.window.activeTextEditor.document.uri.fsPath;
		}
		else {
			vscode.window.showErrorMessage('No file or folder selected');
			return;
		}

		const packageName = findNearestPackageJson(filePath);

		if (packageName) {
			vscode.env.clipboard.writeText(packageName).then(() => {
				vscode.window.showInformationMessage(`Copied package name: ${packageName}`);
			}, (error: any) => {
				vscode.window.showErrorMessage(`Failed to copy package name: ${error}`);
			});
		} else {
			vscode.window.showWarningMessage(`No package.json found in ${filePath} or its parent directories`);
			setTimeout(() => {
				vscode.commands.executeCommand('workbench.action.closeMessages');
			}, 4000);
		}
	});
	context.subscriptions.push(disposable2);

}

// This method is called when your extension is deactivated
export function deactivate() { }

/*
,
      "editor/context": [
        {
          "command": "package-name-copier.copyPackageName",
          "group": "1_cutcopypaste"
        }
      ]
		*/