const baseController = {};
const salesModel = require('../models/salesModel');
const expenseModel = require('../models/expenseModel');
const productionModel = require('../models/productionModel');
const logger = require('../utils/logger');

baseController.buildDashboard = async function (req, res, next) {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const [totalSales, totalExpenses, staffRows, totalDebtors, productionEntries, totalProduction, totalProductionValue, timeOfDayData, staffClearance] = await Promise.all([
            salesModel.getTotalSalesForDate(today),
            expenseModel.getTotalExpensesForDate(today),
            salesModel.getTopStaffSalesForDate(today, 5),
            salesModel.getTotalDebtorsForDate(today),
            productionModel.getEntriesForDate(today),
            productionModel.getTotalForDate(today),
            productionModel.getTotalValueForDate(today),
            salesModel.getSalesByTimeOfDay(today),
            salesModel.getStaffClearanceForDate(today)
        ]);

        const profit = parseFloat(totalSales) - parseFloat(totalExpenses) - parseFloat(totalProductionValue);
        
        const breakfastTotal = timeOfDayData.breakfast.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        const lunchTotal = timeOfDayData.lunch.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

        // Calculate payment summary
        const paidTotal = staffClearance.reduce((sum, s) => sum + parseFloat(s.paid_amount || 0), 0);
        const unpaidTotal = staffClearance.reduce((sum, s) => sum + parseFloat(s.unpaid_amount || 0), 0);

        const staff = (staffRows || []).map(r => ({ name: r.name, sales: r.sales }));

        logger.info(`Dashboard data for ${today}: totalSales=${totalSales} totalExpenses=${totalExpenses} profit=${profit}`);

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
            staff,
            totalProduction,
            totalProductionValue,
            breakfastTotal,
            lunchTotal,
            breakfastCount: timeOfDayData.breakfast.length,
            lunchCount: timeOfDayData.lunch.length,
            paidTotal,
            unpaidTotal,
            staffClearanceCount: staffClearance.length
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
            staff: [],
            totalProduction: 0,
            totalProductionValue: 0,
            breakfastTotal: 0,
            lunchTotal: 0,
            breakfastCount: 0,
            lunchCount: 0,
            paidTotal: 0,
            unpaidTotal: 0,
            staffClearanceCount: 0
        });
    }
}

baseController.buildSignup = async function (req, res, next) {
    res.render('signup', { title: 'Signup' });
}

module.exports = baseController;