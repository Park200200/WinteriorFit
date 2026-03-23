const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'components', 'data', 'snapshot_data.json'),
    path.join(__dirname, 'components', 'data', 'basic_tree.json'),
    path.join(__dirname, 'components', 'data', 'partner_trees.json')
];

const targetCostId = "cost-1771383826003";

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(targetCostId)) {
                console.log(`FOUND in ${file}`);
                // find context
                const index = content.indexOf(targetCostId);
                const start = Math.max(0, index - 500);
                const end = Math.min(content.length, index + 500);
                console.log(content.substring(start, end));
            } else {
                console.log(`NOT FOUND in ${file}`);
            }
        } else {
            console.log(`File not found: ${file}`);
        }
    } catch (e) {
        console.error(`Error reading ${file}:`, e);
    }
});
