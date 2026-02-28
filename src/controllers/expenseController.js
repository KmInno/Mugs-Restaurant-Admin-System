const expenseModel = require('../models/expenseModel');
const templateModel = require('../models/expenseTemplateModel');
const logger = require('../utils/logger');

async function showExpensesPage(req, res) {
	try {
		const today = new Date().toISOString().slice(0, 10);
		const totalExpenses = await expenseModel.getTotalExpensesForDate(today);
		const expenses = await expenseModel.getAllExpenses();
		logger.info(`showExpensesPage totalExpenses for ${today} -> ${totalExpenses}; expenses count=${expenses.length}`);
		res.render('expenses', { title: 'Expenses', totalExpenses, expenses });
	} catch (err) {
		logger.error('Error showing expenses page: ' + (err && err.message ? err.message : err));
		res.render('expenses', { title: 'Expenses', totalExpenses: 0, expenses: [] });
	}
}

async function createExpense(req, res) {
	try {
		logger.info(`createExpense payload: ${JSON.stringify(req.body)}`);
		const { amount, description, added_by, status } = req.body;

		if (!amount) {
			logger.warn('createExpense: missing amount');
			return res.status(400).send('Amount is required');
		}
		if (!description) {
			logger.warn('createExpense: missing description');
			return res.status(400).send('Description is required');
		}

		const amountNum = parseFloat(amount);
		if (Number.isNaN(amountNum) || amountNum <= 0) {
			logger.warn('createExpense: invalid amount', amount);
			return res.status(400).send('Invalid amount');
		}

		const result = await expenseModel.newDailyExpense(amountNum, description, added_by || null, status || 'credit', new Date().toISOString().slice(0,19).replace('T',' '));
		logger.info(`createExpense amount=${amountNum} added_by=${added_by} status=${status} insertId=${result.insertId}`);
		res.redirect('/expenses');
	} catch (err) {
		logger.error('Error creating expense: ' + (err && err.message ? err.message : err) + (err && err.sqlMessage ? ' SQL: ' + err.sqlMessage : ''));
		res.status(500).send('Failed to create expense');
	}
}

async function showAddExpensePage(req, res) {
	try {
		const templates = await templateModel.getAllTemplates();
        logger.info(`showAddExpensePage templates count=${templates.length}`);
		res.render('expenses_add', { title: 'Add Expense', templates });
	} catch (err) {
		logger.error('Error rendering add expense page: ' + (err && err.message ? err.message : err));
		res.status(500).send('Unable to load add-expense page');
	}
}

async function updateExpenseStatus(req, res) {
	try {
		const id = req.params.id;
		const { status } = req.body;
		logger.info(`updateExpenseStatus payload id=${id} status=${status}`);
		if (!id || !status) return res.status(400).send('Missing id or status');
		await expenseModel.updateExpenseStatus(id, status);
		return res.redirect('/expenses');
	} catch (err) {
		logger.error('Error updating expense status: ' + (err && err.message ? err.message : err));
		return res.status(500).send('Failed to update status');
	}
}

module.exports = { showExpensesPage, createExpense, showAddExpensePage, updateExpenseStatus };
