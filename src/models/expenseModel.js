const initializeDB = require('../config/db');
const logger = require('../utils/logger');

async function newDailyExpense(amount, description, added_by, status = 'credit', date) {
    const db = await initializeDB();

    try {
        const sql = 'INSERT INTO expenses (amount, description, status, created_at) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(sql, [amount, description, status, date]);
        logger.info(`newDailyExpense amount=${amount} added_by=${added_by} status=${status} insertId=${result.insertId}`);
        return result;
    }

    catch (error) {
        logger.error('Error inserting new daily expense:', error);
        throw error;
    }

    finally {
        await db.end();
    }
}

async function getTotalExpensesForDate(date) {
    const db = await initializeDB();
    try {
        const sql = 'SELECT IFNULL(SUM(amount), 0) AS total FROM expenses WHERE DATE(created_at) = ?';
        const [rows] = await db.execute(sql, [date]);
        const total = rows[0].total || 0;
        logger.info(`getTotalExpensesForDate ${date} -> ${total}`);
        return total;
    } catch (error) {
        logger.error('Error fetching total expenses:', error);
        throw error;
    } finally {
        await db.end();
    }
}

module.exports = { newDailyExpense, getTotalExpensesForDate };

async function getAllExpenses() {
    const db = await initializeDB();
    try {
        const sql = `SELECT e.id, e.description, e.amount, e.added_by, e.status, e.created_at, u.name as added_by_name
                     FROM expenses e
                     LEFT JOIN users u ON e.added_by = u.id
                     ORDER BY e.created_at DESC`;
        const [rows] = await db.execute(sql);
        logger.info(`getAllExpenses -> ${rows.length} rows`);
        return rows;
    } catch (error) {
        logger.error('Error fetching all expenses: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

module.exports = { newDailyExpense, getTotalExpensesForDate, getAllExpenses };

async function updateExpenseStatus(id, status) {
    const db = await initializeDB();
    try {
        const sql = 'UPDATE expenses SET status = ? WHERE id = ?';
        const [result] = await db.execute(sql, [status, id]);
        logger.info(`updateExpenseStatus id=${id} status=${status} affected=${result.affectedRows}`);
        return result;
    } catch (error) {
        logger.error('Error updating expense status: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

module.exports = { newDailyExpense, getTotalExpensesForDate, getAllExpenses, updateExpenseStatus };