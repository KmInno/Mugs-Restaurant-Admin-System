const baseController = {};
const salesModel = require('../models/salesModel');
const expenseModel = require('../models/expenseModel');
const logger = require('../utils/logger');

baseController.buildDashboard = async function (req, res, next) {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const [totalSales, totalExpenses, staffRows, totalDebtors] = await Promise.all([
            salesModel.getTotalSalesForDate(today),
            expenseModel.getTotalExpensesForDate(today),
            salesModel.getTopStaffSalesForDate(today, 5),
            salesModel.getTotalDebtorsForDate(today)
        ]);

        const profit = parseFloat(totalSales) - parseFloat(totalExpenses);

        const staff = (staffRows || []).map(r => ({ name: r.name, sales: r.sales }));

        logger.info(`Dashboard data for ${today}: totalSales=${totalSales} totalExpenses=${totalExpenses} profit=${profit}`);
        logger.info(`Top staff rows: ${JSON.stringify(staffRows)}`);

        const user = req.session && req.session.user ? req.session.user : null;
        // Render a simplified employee dashboard for non-admin users
        if (user && user.role && user.role !== 'admin') {
            // For employees, show only sales-related info
            return res.render('employee_dashboard', {
                title: 'Dashboard',
                userName: user.email || 'Employee',
                totalSales,
                staff
            });
        }

        res.render('dashboard', {
            title: 'Dashboard',
            userName: user ? (user.email || 'Guest') : 'Guest',
            totalSales,
            totalExpenses,
            totalDebtors,
            profit,
            staff
        });
    } catch (err) {
        logger.error('Error building dashboard: ' + (err && err.message ? err.message : err));
        const user = req.session && req.session.user ? req.session.user : null;
        if (user && user.role && user.role !== 'admin') {
            return res.render('employee_dashboard', {
                title: 'Dashboard',
                userName: user.email || 'Employee',
                totalSales: 0,
                staff: []
            });
        }
        res.render('dashboard', {
            title: 'Dashboard',
            userName: user ? (user.email || 'Guest') : 'Guest',
            totalSales: 0,
            totalExpenses: 0,
            profit: 0,
            staff: []
        });
    }
}

baseController.buildSignup = async function (req, res, next) {
    res.render('signup', { title: 'Signup' });
}

module.exports = baseController;