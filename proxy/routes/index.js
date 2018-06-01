const express = require('express');
const router = express.Router();
const monitor = require('../lib/monitoring');
const Store = require('../controllers/store');
const _ = require('lodash');

// Error handler for async functions 
function catchErrors(fn) {
	return (req, res, next) => {
		return fn(req, res, next).catch(next);
	};
}

// If an subscription is recieved emit socket io events
// using the attribute values from the data received to define
// who to send the event too.
function broadcastEvents(req, item, types) {
	const message = req.params.type + ' received';
	_.forEach(types, type => {
		if (item[type]) {
			monitor(item[type], message);
		}
	});
}


// Render the home page.
router.get('/', function(req, res) {
	res.render('index', { title: 'FIWARE Tutorial' });
});

// Render the monitoring page
router.get('/device/monitor', function(req, res) {
	res.render('device-monitor', { title: 'UltraLight IoT Devices' });
});

router.get('/app/monitor', function(req, res) {
	res.render('monitor', { title: 'Event Monitor' });
});

// Render a store with products and warehouse notifications
router.get('/app/store/:storeId', Store.displayStore);
router.get('/app/store/:storeId/till', Store.displayTillInfo);
router.get('/app/store/:storeId/warehouse', Store.displayWarehouseInfo);
// Buy something.
router.post('/app/inventory/:inventoryId', catchErrors(Store.buyItem));
router.post('/app/store/:storeId/warehouse', Store.sendCommand);

// Whenever a subscription is received, display it on the monitor
// and notify any interested parties using Socket.io
router.post('/subscription/:type', (req, res) => {
	monitor('notify', req.params.type + ' received', req, req.body);
	_.forEach(req.body.data, item => {
		broadcastEvents(req, item, ['refStore', 'refProduct', 'refShelf', 'type']);
	});
	res.status(204).send();
});

module.exports = router;
