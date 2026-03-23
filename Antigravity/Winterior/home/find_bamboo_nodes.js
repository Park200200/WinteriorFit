const fs = require('fs');
const path = 'c:/Users/Lenovo/Antigravity/WinteriorBP/3/components/data/snapshot_data.json';

try {
    const data = fs.readFileSync(path, 'utf8');
    const nodes = JSON.parse(data);
    const results = [];

    Object.values(nodes).forEach(node => {
        if (node.label && node.label.includes('대나무')) {
            const parent = nodes[node.parentId];
            const parentLabel = parent ? parent.label : 'No Parent';
            const hasCosts = !!node.attributes?.cost_fabric_list;
            const costList = hasCosts ? JSON.parse(node.attributes.cost_fabric_list) : [];
            const sourceIds = node.sourceIds || [];

            results.push({
                id: node.id,
                label: node.label,
                parentId: node.parentId,
                parentLabel: parentLabel,
                displayLabel: `${parentLabel} > ${node.label}`,
                hasCosts,
                costCount: costList.length,
                firstCost: costList.length > 0 ? costList[0] : null,
                sourceIds: sourceIds
            });
        }
    });

    console.log(JSON.stringify(results, null, 2));
} catch (e) {
    console.error('Error:', e);
}
