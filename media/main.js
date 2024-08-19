(function () {
    const vscode = acquireVsCodeApi();

    document.getElementById('controlFlowBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'generateControlFlow' });
    });

    document.getElementById('architectureBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'generateArchitecture' });
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'updateControlFlow':
                updateDiagram(message.data, 'Control Flow');
                break;
            case 'updateArchitecture':
                updateDiagram(message.data, 'Architecture');
                break;
        }
    });

    function updateDiagram(data, title) {
        const diagramDiv = document.getElementById('diagram');
        diagramDiv.innerHTML = `<h2>${title}</h2><div class="mermaid">${generateMermaidDefinition(data, title)}</div>`;
        mermaid.init(undefined, document.querySelector('.mermaid'));
    }

    function generateMermaidDefinition(data, type) {
        let def = 'graph TD\n';
        if (type === 'Control Flow') {
            data.nodes.forEach(node => {
                def += `    ${node.id}["${node.label}"]\n`;
            });
            data.edges.forEach(edge => {
                def += `    ${edge.from} --> ${edge.to}\n`;
            });
        } else if (type === 'Architecture') {
            data.components.forEach(component => {
                def += `    ${component.name}["${component.name}"]\n`;
            });
            data.relationships.forEach(rel => {
                def += `    ${rel.from} --> ${rel.to}\n`;
            });
        }
        return def;
    }
}());