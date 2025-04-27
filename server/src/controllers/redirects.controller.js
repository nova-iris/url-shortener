const router = require('express').Router();
const { URLModel } = require('../models/url.model');

router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const url = await URLModel.findOne({
            urlCode: code
        });
        if (url) {
            return res.json({ longUrl: url.longUrl });
        } else {
            return res.status(404).json({ error: 'No URL Found' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;