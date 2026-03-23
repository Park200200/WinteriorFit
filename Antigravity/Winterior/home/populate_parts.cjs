const fs = require('fs');
const file = 'c:/Users/Lenovo/Antigravity/WinteriorBP/5/components/data/basic_tree.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let updated = 0;
const colors = ['빨강', '파랑', '노랑', '검정', '흰색'];

Object.values(data).forEach(node => {
    // The left sidebar typically shows system categories or standard products.
    // The user wants 10 sample parts per category based on its name.
    if ((node.type === 'STANDARD_PRODUCT' || node.type === 'SYSTEM_CATEGORY' || node.type === 'PRODUCT_GROUP') && node.label) {

        // Let's just populate cost_parts_list for any node that represents an item on the left tree.
        const parts = Array.from({ length: 10 }, (_, i) => ({
            id: `part-${node.id}-${Date.now()}-${i + 1}`,
            name: `${node.label} 부품 ${i + 1}`,
            spec: `규격${i + 1}`,
            color: colors[i % 5],
            usageUnit: '개',
            usageQty: String(i + 1),
            inventoryUnit: 'EA',
            cost: String((i + 1) * 1000),
            updatedAt: new Date().toISOString().split('T')[0]
        }));

        node.attributes = node.attributes || {};
        node.attributes.cost_parts_list = JSON.stringify(parts);
        updated++;
    }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Updated nodes:', updated);
