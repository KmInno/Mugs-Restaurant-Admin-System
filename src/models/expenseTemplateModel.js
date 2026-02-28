const initializeDB = require('../config/db');
const logger = require('../utils/logger');

async function getAllTemplates() {
    const db = await initializeDB();
    try {
        const sql = `SELECT id, name, created_at FROM expense_templates ORDER BY name`;
        const [rows] = await db.execute(sql);
        logger.info(`getAllTemplates -> ${rows.length} rows`);
        return rows;
    } catch (error) {
        logger.error('Error fetching expense templates: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

async function getTemplateById(id) {
    const db = await initializeDB();
    try {
        const sql = 'SELECT id, name, created_at FROM expense_templates WHERE id = ? LIMIT 1';
        const [rows] = await db.execute(sql, [id]);
        return rows && rows[0] ? rows[0] : null;
    } catch (error) {
        logger.error('Error fetching template by id: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

async function createTemplate(name) {
    const db = await initializeDB();
    try {
        const sql = 'INSERT INTO expense_templates (name, created_at) VALUES (?, ?)';
        const now = new Date().toISOString().slice(0,19).replace('T',' ');
        const [result] = await db.execute(sql, [name, now]);
        logger.info(`createTemplate name=${name} insertId=${result.insertId}`);
        return result;
    } catch (error) {
        logger.error('Error creating expense template: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

async function updateTemplate(id, name) {
    const db = await initializeDB();
    try {
        const sql = 'UPDATE expense_templates SET name = ? WHERE id = ?';
        const [result] = await db.execute(sql, [name, id]);
        logger.info(`updateTemplate id=${id} affected=${result.affectedRows}`);
        return result;
    } catch (error) {
        logger.error('Error updating expense template: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

async function deleteTemplate(id) {
    const db = await initializeDB();
    try {
        const sql = 'DELETE FROM expense_templates WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        logger.info(`deleteTemplate id=${id} affected=${result.affectedRows}`);
        return result;
    } catch (error) {
        logger.error('Error deleting expense template: ' + (error && error.message ? error.message : error));
        throw error;
    } finally {
        await db.end();
    }
}

module.exports = { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate };
