import * as vscode from 'vscode';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as path from 'path';

interface ControlFlowData {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ from: string; to: string }>;
}

interface Component {
    name: string;
    imports: string[];
    props: string[];
    emits: string[];
}

interface ArchitectureData {
    components: Component[];
    relationships: Array<{ from: string; to: string }>;
}

export async function generateControlFlow(): Promise<ControlFlowData> {
    const files = await getVueFiles();
    return analyzeControlFlow(files);
}

export async function generateArchitecture(): Promise<ArchitectureData> {
    const files = await getVueFiles();
    return analyzeArchitecture(files);
}

async function getVueFiles(): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles('**/*.vue');
}

async function analyzeControlFlow(files: vscode.Uri[]): Promise<ControlFlowData> {
    const controlFlowData: ControlFlowData = {
        nodes: [],
        edges: []
    };

    for (const file of files) {
        const content = await vscode.workspace.fs.readFile(file);
        const code = content.toString();

        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        const fileName = path.basename(file.fsPath);

        traverse(ast, {
            CallExpression(path) {
                const callee = path.node.callee;
                if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
                    const methodName = callee.property.name;

                    if (!controlFlowData.nodes.some(node => node.id === fileName)) {
                        controlFlowData.nodes.push({ id: fileName, label: fileName });
                    }

                    if (!controlFlowData.nodes.some(node => node.id === methodName)) {
                        controlFlowData.nodes.push({ id: methodName, label: methodName });
                    }

                    controlFlowData.edges.push({ from: fileName, to: methodName });
                }
            }
        });
    }

    return controlFlowData;
}

async function analyzeArchitecture(files: vscode.Uri[]): Promise<ArchitectureData> {
    const architectureData: ArchitectureData = {
        components: [],
        relationships: []
    };

    for (const file of files) {
        const content = await vscode.workspace.fs.readFile(file);
        const code = content.toString();

        const ast = parser.parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx', 'vue'],
          tokens: true
        });

        const fileName = path.basename(file.fsPath);
        const component: Component = { name: fileName, imports: [], props: [], emits: [] };

        traverse(ast, {
            ImportDeclaration(path) {
                const importName = path.node.source.value;
                component.imports.push(importName);
            },
            ObjectProperty(path) {
                if (path.node.key.type === 'Identifier') {
                    if (path.node.key.name === 'props' && path.node.value.type === 'ObjectExpression') {
                        path.node.value.properties.forEach((prop) => {
                            if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                                component.props.push(prop.key.name);
                            }
                        });
                    }
                    if (path.node.key.name === 'emits' && path.node.value.type === 'ArrayExpression') {
                        path.node.value.elements.forEach((emit) => {
                            if (emit && emit.type === 'StringLiteral') {
                                component.emits.push(emit.value);
                            }
                        });
                    }
                }
            }
        });

        architectureData.components.push(component);
    }

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