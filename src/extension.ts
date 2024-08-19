import * as vscode from 'vscode';
import { generateControlFlow, generateArchitecture } from './analyzer';
import { CodebaseVisualizerViewProvider } from './CodebaseVisualizerViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Codebase Visualizer is now active!');

    const codebaseVisualizerViewProvider = new CodebaseVisualizerViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(CodebaseVisualizerViewProvider.viewType, codebaseVisualizerViewProvider)
    );

    let generateControlFlowCommand = vscode.commands.registerCommand('codebase-visualizer.generateControlFlow', async () => {
        const controlFlowData = await generateControlFlow();
        codebaseVisualizerViewProvider.updateControlFlow(controlFlowData);
    });

    let generateArchitectureCommand = vscode.commands.registerCommand('codebase-visualizer.generateArchitecture', async () => {
        const architectureData = await generateArchitecture();
        codebaseVisualizerViewProvider.updateArchitecture(architectureData);
    });

    context.subscriptions.push(generateControlFlowCommand, generateArchitectureCommand);
}

export function deactivate() {}