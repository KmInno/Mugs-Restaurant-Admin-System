const templateModel = require('../models/expenseTemplateModel');
const inventoryModel = require('../models/inventoryModel');
const logger = require('../utils/logger');

async function showSettings(req, res) {
    try {
        res.render('settings', { title: 'Settings' });
    } catch (err) {
        logger.error('Error rendering settings: ' + (err && err.message ? err.message : err));
        res.status(500).send('Unable to load settings');
    }
}

async function showExpenseTemplates(req, res) {
    try {
        const templates = await templateModel.getAllTemplates();
        res.render('expense_templates', { 
            title: 'Expense Templates', 
            templates 
        });
    } catch (err) {
        logger.error('Error showing templates: ' + (err && err.message ? err.message : err));
        if (err && err.stack) logger.error(err.stack);
        res.status(500).send('Unable to load templates');
    }
}

async function showAddTemplate(req, res) {
    try {
        res.render('expense_template_form', { title: 'Add Expense Template', template: null });
    } catch (err) {
        logger.error('Error rendering add template form: ' + (err && err.message ? err.message : err));
        if (err && err.stack) logger.error(err.stack);
        res.status(500).send('Unable to load template form');
    }
}

async function createTemplate(req, res) {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).send('Name required');
        await templateModel.createTemplate(name);
        res.redirect('/settings/expenses/templates');
    } catch (err) {
        logger.error('Error creating template: ' + (err && err.message ? err.message : err));
        if (err && err.stack) logger.error(err.stack);
        res.status(500).send('Failed to create template');
    }
}

async function showEditTemplate(req, res) {
    try {
        const id = req.params.id;
        const template = await templateModel.getTemplateById(id);
        if (!template) return res.status(404).send('Template not found');
        res.render('expense_template_form', { title: 'Edit Template', template });
    } catch (err) {
        logger.error('Error rendering edit template form: ' + (err && err.message ? err.message : err));
        res.status(500).send('Unable to load template form');
    }
}

async function updateTemplate(req, res) {
    try {
        const id = req.params.id;
        const { name } = req.body;
        if (!name) return res.status(400).send('Name required');
        await templateModel.updateTemplate(id, name);
        res.redirect('/settings/expenses/templates');
    } catch (err) {
        logger.error('Error updating template: ' + (err && err.message ? err.message : err));
        res.status(500).send('Failed to update template');
    }
}

async function deleteTemplate(req, res) {
    try {
        const id = req.params.id;
        await templateModel.deleteTemplate(id);
        res.redirect('/settings/expenses/templates');
    } catch (err) {
        logger.error('Error deleting template: ' + (err && err.message ? err.message : err));
        res.status(500).send('Failed to delete template');
    }
}

async function showInventory(req, res) {
    try {
        const items = await inventoryModel.getAllItems();
        res.render('inventory', { title: 'Inventory', items, user: req.session.user });
    } catch (err) {
        logger.error('Error rendering inventory: ' + (err && err.message ? err.message : err));
        res.status(500).send('Unable to load inventory');
    }
}

async function showAddInventory(req, res) {
    try {
        res.render('inventory_add', { title: 'Add Inventory Item' });
    } catch (err) {
        logger.error('Error rendering add inventory form: ' + (err && err.message ? err.message : err));
        res.status(500).send('Unable to load add item form');
    }
}

async function createInventoryItem(req, res) {
    try {
        const { name, sku, quantity, notes } = req.body;
        if (!name) return res.status(400).send('Name required');
        const added_by = req.session && req.session.user ? req.session.user.id : null;
        await inventoryModel.createItem({ name, sku, quantity: Number(quantity) || 0, notes, added_by });
        res.redirect('/settings/inventory');
    } catch (err) {
        logger.error('Error creating inventory item: ' + (err && err.message ? err.message : err));
        res.status(500).send('Failed to create inventory item');
    }
}

async function updateInventoryStatus(req, res) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!['instock','outofstock'].includes(status)) return res.status(400).send('Invalid status');
        await inventoryModel.updateStatus(id, status);
        res.redirect('/settings/inventory');
    } catch (err) {
        logger.error('Error updating inventory status: ' + (err && err.message ? err.message : err));
        res.status(500).send('Failed to update inventory status');
    }
}

module.exports = {
    showSettings,
    showExpenseTemplates,
    showAddTemplate,
    createTemplate,
    showEditTemplate,
    updateTemplate,
    deleteTemplate,
    showInventory,
    showAddInventory,
    createInventoryItem,
    updateInventoryStatus
};
