import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as path from 'path';

export async function generateControlFlow(): Promise<any> {
    const files = await getVueFiles();
    return analyzeControlFlow(files);
}

export async function generateArchitecture(): Promise<any> {
    const files = await getVueFiles();
    return analyzeArchitecture(files);
}

async function getVueFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.vue');
}

// Analyze control flow in Vue files
async function analyzeControlFlow(files: vscode.Uri[]): Promise<any> {
    const controlFlowData: any = {
        nodes: [],
        edges: []
    };

    for (const file of files) {
        const content = await vscode.workspace.fs.readFile(file);
        const code = content.toString();

        // Parse the Vue file
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        // Traverse the AST
        traverse(ast, {
            CallExpression(path) {
                const callee = path.node.callee;
                if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
                    const methodName = callee.property.name;
                    const fileName = path.basename(file.fsPath);

                    // Add node for the file if it doesn't exist
                    if (!controlFlowData.nodes.some((node: any) => node.id === fileName)) {
                        controlFlowData.nodes.push({ id: fileName, label: fileName });
                    }

                    // Add node for the method if it doesn't exist
                    if (!controlFlowData.nodes.some((node: any) => node.id === methodName)) {
                        controlFlowData.nodes.push({ id: methodName, label: methodName });
                    }

                    // Add edge between file and method
                    controlFlowData.edges.push({ from: fileName, to: methodName });
                }
            }
        });
    }

    return controlFlowData;
}

// Analyze architecture of Vue files
async function analyzeArchitecture(files: vscode.Uri[]): Promise<any> {
    const architectureData: any = {
        components: [],
        relationships: []
    };

    for (const file of files) {
        const content = await vscode.workspace.fs.readFile(file);
        const code = content.toString();

        // Parse the Vue file
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        const fileName = path.basename(file.fsPath);
        const component = { name: fileName, imports: [], props: [], emits: [] };

        // Traverse the AST
        traverse(ast, {
            ImportDeclaration(path) {
                const importName = path.node.source.value;
                component.imports.push(importName);
            },
            ObjectProperty(path) {
                if (path.node.key.name === 'props' && path.node.value.type === 'ObjectExpression') {
                    path.node.value.properties.forEach((prop: any) => {
                        component.props.push(prop.key.name);
                    });
                }
                if (path.node.key.name === 'emits' && path.node.value.type === 'ArrayExpression') {
                    path.node.value.elements.forEach((emit: any) => {
                        if (emit.type === 'StringLiteral') {
                            component.emits.push(emit.value);
                        }
                    });
                }
            }
        });

        architectureData.components.push(component);
    }

    // Analyze relationships between components
    for (const component of architectureData.components) {
        for (const importName of component.imports) {
            const importedComponent = architectureData.components.find(c => c.name === importName);
            if (importedComponent) {
                architectureData.relationships.push({ from: component.name, to: importedComponent.name });
            }
        }
    }

    return architectureData;
}