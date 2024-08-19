import * as vscode from 'vscode';

export class CodebaseVisualizerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codebaseVisualizerView';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'generateControlFlow':
                    vscode.commands.executeCommand('codebase-visualizer.generateControlFlow');
                    break;
                case 'generateArchitecture':
                    vscode.commands.executeCommand('codebase-visualizer.generateArchitecture');
                    break;
            }
        });
    }

    public updateControlFlow(data: any) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'updateControlFlow', data });
        }
    }

    public updateArchitecture(data: any) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'updateArchitecture', data });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
                <title>Codebase Visualizer</title>
            </head>
            <body>
                <div id="buttons">
                    <button id="controlFlowBtn">Generate Control Flow</button>
                    <button id="architectureBtn">Generate Architecture</button>
                </div>
                <div id="diagram"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}