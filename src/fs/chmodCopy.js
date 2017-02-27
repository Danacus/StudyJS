var jetpack = require('fs-jetpack');
import fs from 'fs';
import path from 'path';

function chmodCopy(source, target) {
	jetpack.dir(target, {
		empty: true,
		mode: '755'
	});
	jetpack.list(source).forEach((_item) => {
		let item = path.join(source, _item);
		let file = fs.statSync(item);
		if (file.isDirectory()) {
			chmodCopy(item, path.join(target, item.split("/")[item.split("/").length - 1]));
		} else {
			jetpack.copy(item, path.join(target, path.basename(item)));
		}
	});
}

export {
	chmodCopy
};
