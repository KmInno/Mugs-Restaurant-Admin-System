const productionModel = require('../models/productionModel');
const logger = require('../utils/logger');

async function showProductionPage(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [entries, total] = await Promise.all([
      productionModel.getEntriesForDate(today),
      productionModel.getTotalForDate(today)
    ]);
    res.render('production', { title: 'Production', entries, total });
  } catch (err) {
    logger.error('Error showing production page: ' + (err && err.message ? err.message : err));
    res.render('production', { title: 'Production', entries: [], total: 0 });
  }
}

async function addProductionEntry(req, res) {
  try {
    const { item, quantity } = req.body;
    if (!item || !quantity) {
      req.flash('error', 'Item and quantity are required');
      return res.redirect('/production');
    }
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 0) {
      req.flash('error', 'Quantity must be a non-negative number');
      return res.redirect('/production');
    }

    await productionModel.createEntry(item, qty);
    req.flash('success', 'Entry recorded');
    return res.redirect('/production');
  } catch (err) {
    logger.error('Error adding production entry: ' + (err && err.message ? err.message : err));
    req.flash('error', 'Failed to record entry');
    return res.redirect('/production');
  }
}

module.exports = { showProductionPage, addProductionEntry };