
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Lenovo', 'Antigravity', 'WinteriorBP', '5', 'components', 'data', 'basic_tree.json');

function generateSampleParts(nodeId) {
    const parts = [];
    const baseParts = [
        ["볼트", "M4x10", "금속"],
        ["너트", "M4", "STS304"],
        ["브라켓", "A-Type", "화이트"],
        ["상부캡", "Standard", "아이보리"],
        ["하단바 마감재", "라운드", "그레이"],
        ["기어박스", "1:1", "블랙"],
        ["클러치", "25mm용", "화이트"],
        ["손잡이", "투명", "N/A"],
        ["코드줄", "1.2mm", "베이지"],
        ["벽면 고정 브라켓", "강화형", "실버"]
    ];

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < baseParts.length; i++) {
        const [name, spec, color] = baseParts[i];
        parts.push({
            id: `sample-part-${nodeId}-${i}`,
            name: `${name} ${i + 1}`,
            spec: spec,
            color: color,
            usageUnit: "개",
            usageQty: "1",
            inventoryUnit: "개",
            cost: ((i + 1) * 100).toLocaleString(),
            updatedAt: today
        });
    }
    return parts;
}

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    const manufacturerRoot = "root-1770804399939-partner-m1";

    if (!data[manufacturerRoot]) {
        console.error(`Error: ${manufacturerRoot} not found in data.`);
        process.exit(1);
    }

    const targetNodes = [];
    const queue = [manufacturerRoot];
    const visited = new Set();

    while (queue.length > 0) {
        const currId = queue.shift();
        if (visited.has(currId)) continue;
        visited.add(currId);

        const node = data[currId];
        if (!node) continue;

        const childrenIds = node.childrenIds || [];

        let hasContainerChildren = false;
        for (const cid of childrenIds) {
            const cnode = data[cid];
            if (cnode) {
                const ctype = cnode.type;
                const ntype = (cnode.attributes || {}).nodeType;
                if (["CATEGORY", "REFERENCE", "ROOT"].includes(ctype) || ["category", "species", "item"].includes(ntype)) {
                    hasContainerChildren = true;
                    break;
                }
            }
        }

        if ((childrenIds.length === 0 || !hasContainerChildren) && currId !== manufacturerRoot) {
            targetNodes.push(currId);
        } else {
            queue.push(...childrenIds);
        }
    }

    console.log(`Found ${targetNodes.length} target nodes.`);

    for (const nodeId of targetNodes) {
        const node = data[nodeId];
        if (!node.attributes) node.attributes = {};

        const sampleParts = generateSampleParts(nodeId);
        node.attributes.cost_parts_list = JSON.stringify(sampleParts);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Successfully updated basic_tree.json with sample parts.");

} catch (err) {
    console.error("Failed to run script:", err);
    process.exit(1);
}
